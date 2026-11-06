import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { detectPrintersAndPorts, printRawToWindowsPrinter, printRawToSerial } from './src/server/printerBridge.js';

function thermalPrinterPlugin(): Plugin {
  return {
    name: 'thermal-printer-bridge',
    configureServer(server) {
      server.middlewares.use('/api/printers', async (req, res) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          try {
            const data = detectPrintersAndPorts();
            res.end(JSON.stringify(data));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
          return;
        }
        res.statusCode = 405;
        res.end();
      });

      server.middlewares.use('/api/print-thermal', async (req, res) => {
        if (req.method === 'POST') {
          const chunks: any[] = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', async () => {
            try {
              const body = Buffer.concat(chunks);
              let printerName = (req.headers['x-printer-name'] as string) || 'Everycom-58-Series';
              let portName = req.headers['x-port-name'] as string | undefined;

              let payloadBuffer = body;
              if (req.headers['content-type']?.includes('application/json')) {
                const json = JSON.parse(body.toString());
                if (json.data) {
                  payloadBuffer = Buffer.from(json.data, 'base64');
                }
                if (json.printerName) printerName = json.printerName;
                if (json.portName) portName = json.portName;
              }

              if (portName) {
                await printRawToSerial(portName, payloadBuffer);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, target: portName }));
              } else {
                await printRawToWindowsPrinter(printerName, payloadBuffer);
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, target: printerName }));
              }
            } catch (err: any) {
              console.error('Print-thermal error:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }
        res.statusCode = 405;
        res.end();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), thermalPrinterPlugin()],
    optimizeDeps: {
      include: ['react-is', 'recharts', 'lucide-react', 'jsbarcode', 'qrcode'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
