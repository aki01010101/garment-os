import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec, execSync } from 'child_process';

/**
 * Send raw binary ESC/POS payload directly to a Windows Printer (e.g. Everycom-58-Series)
 * Bypasses Windows GDI halftoning and prints at native 203 DPI pitch-black quality.
 */
export function printRawToWindowsPrinter(printerName = 'Everycom-58-Series', buffer) {
  return new Promise((resolve, reject) => {
    const tmpBin = path.join(os.tmpdir(), `gos_usb_${Date.now()}_${Math.random().toString(36).substring(7)}.bin`);
    fs.writeFileSync(tmpBin, buffer);

    const psScript = `
$bytes = [System.IO.File]::ReadAllBytes('${tmpBin.replace(/'/g, "''")}');
$code = @'
using System;
using System.Runtime.InteropServices;
public class RawPrinterHelper {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }
    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true)]
    public static extern bool OpenPrinter(string p, out IntPtr h, IntPtr pd);
    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter")]
    public static extern bool ClosePrinter(IntPtr h);
    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA")]
    public static extern bool StartDocPrinter(IntPtr h, int l, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter")]
    public static extern bool EndDocPrinter(IntPtr h);
    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter")]
    public static extern bool StartPagePrinter(IntPtr h);
    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter")]
    public static extern bool EndPagePrinter(IntPtr h);
    [DllImport("winspool.Drv", EntryPoint = "WritePrinter")]
    public static extern bool WritePrinter(IntPtr h, IntPtr pBytes, int dwCount, out int dwWritten);

    public static bool SendBytesToPrinter(string szPrinterName, byte[] bytes) {
        IntPtr hPrinter;
        DOCINFOA di = new DOCINFOA { pDocName = "GarmentOS Receipt", pDataType = "RAW" };
        if (OpenPrinter(szPrinterName, out hPrinter, IntPtr.Zero)) {
            if (StartDocPrinter(hPrinter, 1, di)) {
                if (StartPagePrinter(hPrinter)) {
                    IntPtr pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
                    Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
                    int dwWritten;
                    bool ok = WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                    Marshal.FreeCoTaskMem(pUnmanagedBytes);
                    EndPagePrinter(hPrinter);
                    EndDocPrinter(hPrinter);
                    ClosePrinter(hPrinter);
                    return ok;
                }
                EndDocPrinter(hPrinter);
            }
            ClosePrinter(hPrinter);
        }
        return false;
    }
}
'@;
if (-not ([System.Management.Automation.PSTypeName]'RawPrinterHelper').Type) {
    Add-Type -TypeDefinition $code;
}
$res = [RawPrinterHelper]::SendBytesToPrinter('${printerName.replace(/'/g, "''")}', $bytes);
Remove-Item -Path '${tmpBin.replace(/'/g, "''")}' -ErrorAction SilentlyContinue;
Write-Output $res;
`;
    const psFile = path.join(os.tmpdir(), `gos_usb_${Date.now()}.ps1`);
    fs.writeFileSync(psFile, psScript);

    exec(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, (err, stdout, stderr) => {
      try { fs.unlinkSync(psFile); } catch {}
      try { if (fs.existsSync(tmpBin)) fs.unlinkSync(tmpBin); } catch {}
      if (err) return reject(err);
      const out = stdout.trim();
      if (out === 'True') {
        resolve({ success: true, printerName });
      } else {
        reject(new Error(stderr || `Printing returned: ${out}`));
      }
    });
  });
}

/**
 * Send raw binary ESC/POS payload directly to a Bluetooth/USB Serial COM port (e.g. COM4)
 */
export function printRawToSerial(portName = 'COM4', buffer) {
  return new Promise((resolve, reject) => {
    const tmpBin = path.join(os.tmpdir(), `gos_bt_${Date.now()}_${Math.random().toString(36).substring(7)}.bin`);
    fs.writeFileSync(tmpBin, buffer);

    const psScript = `
$bytes = [System.IO.File]::ReadAllBytes('${tmpBin.replace(/'/g, "''")}');
try {
    $sp = New-Object System.IO.Ports.SerialPort "${portName}", 9600, "None", 8, "One";
    $sp.WriteTimeout = 3000;
    $sp.Open();
    $sp.BaseStream.Write($bytes, 0, $bytes.Length);
    $sp.BaseStream.Flush();
    Start-Sleep -Milliseconds 250;
    $sp.Close();
    Write-Output "SUCCESS";
} catch {
    Write-Output "ERROR: $($_.Exception.Message)";
}
Remove-Item -Path '${tmpBin.replace(/'/g, "''")}' -ErrorAction SilentlyContinue;
`;
    const psFile = path.join(os.tmpdir(), `gos_bt_${Date.now()}.ps1`);
    fs.writeFileSync(psFile, psScript);

    exec(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, (err, stdout, stderr) => {
      try { fs.unlinkSync(psFile); } catch {}
      try { if (fs.existsSync(tmpBin)) fs.unlinkSync(tmpBin); } catch {}
      if (err) return reject(err);
      const out = stdout.trim();
      if (out.includes('SUCCESS')) {
        resolve({ success: true, port: portName });
      } else {
        reject(new Error(out || stderr));
      }
    });
  });
}

/**
 * Detect thermal printers and COM ports on Windows
 */
export function detectPrintersAndPorts() {
  try {
    const psScript = `
$printers = Get-Printer | Where-Object { $_.Name -like '*Everycom*' -or $_.Name -like '*POS*' -or $_.DriverName -like '*58*' -or $_.DriverName -like '*80*' -or $_.DriverName -like '*POS*' -or $_.DriverName -like '*Thermal*' } | Select-Object Name, DriverName, PortName;
$ports = Get-CimInstance Win32_SerialPort | Select-Object DeviceID, Name, Description;
@{ printers = @($printers); ports = @($ports) } | ConvertTo-Json -Compress
`;
    const tmpFile = path.join(os.tmpdir(), `detect_printers_${Date.now()}.ps1`);
    fs.writeFileSync(tmpFile, psScript);
    const output = execSync(`powershell -ExecutionPolicy Bypass -File "${tmpFile}"`).toString();
    try { fs.unlinkSync(tmpFile); } catch {}
    return JSON.parse(output.trim() || '{"printers":[],"ports":[]}');
  } catch (err) {
    console.error('Error detecting printers:', err);
    return { printers: [], ports: [] };
  }
}
