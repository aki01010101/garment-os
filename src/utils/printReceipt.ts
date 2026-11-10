/**
 * High-reliability thermal receipt printing utility.
 * Creates an isolated, zero-margin printable iframe specifically tailored for 58mm thermal printers.
 * Works seamlessly inside and outside iframes without layout distortion.
 * Supports high-density bold mode for faint thermal printer heads.
 */
export function printThermalReceiptHtml(receiptHtml: string, isBold?: boolean | string) {
  try {
    const isZReport =
      receiptHtml.toLowerCase().includes('z-report') ||
      receiptHtml.toLowerCase().includes('sales by tender') ||
      receiptHtml.toLowerCase().includes('end-of-day summary');

    const boldActive =
      isBold !== false &&
      (typeof localStorage === 'undefined' || localStorage.getItem('thermal_bold_print') !== 'false');

    // 1. Also update or create the DOM print mount point
    let printMount = document.getElementById('print-mount-point');
    if (!printMount) {
      printMount = document.createElement('div');
      printMount.id = 'print-mount-point';
      printMount.className = 'no-print';
      printMount.style.display = 'none';
      document.body.appendChild(printMount);
    }
    printMount.innerHTML = receiptHtml;
    if (boldActive) {
      printMount.classList.add('thermal-bold');
    } else {
      printMount.classList.remove('thermal-bold');
    }

    // 2. Create or reuse hidden print iframe
    let iframe = document.getElementById('thermal-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'thermal-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      window.focus();
      window.print();
      return;
    }

    const boldCss = boldActive
      ? `
        body, p, span, div, td, th {
          font-weight: 800 !important;
          color: #000000 !important;
          -webkit-text-stroke: 0.35px #000000;
          -webkit-font-smoothing: none !important;
          font-smooth: never !important;
          text-rendering: geometricPrecision !important;
          image-rendering: pixelated !important;
        }
        hr {
          border-top: 1.5px solid #000000 !important;
        }
        .receipt-title {
          font-size: 13px !important;
          font-weight: 900 !important;
          -webkit-text-stroke: 0.6px #000000;
        }
        .receipt-sub {
          font-size: 8.5px !important;
          font-weight: 700 !important;
          color: #000000 !important;
        }
        .receipt-table-header {
          border-top: 1.5px solid #000000 !important;
          border-bottom: 1.5px solid #000000 !important;
          font-weight: 900 !important;
        }
        .receipt-thanks {
          font-size: 10px !important;
          font-weight: 900 !important;
          -webkit-text-stroke: 0.4px #000000;
        }
        .receipt-net-payable .net-label {
          font-size: 13.5px !important;
          font-weight: 900 !important;
          -webkit-text-stroke: 0.5px #000000;
        }
        .receipt-net-payable .net-amount {
          font-size: 18.5px !important;
          font-weight: 900 !important;
          -webkit-text-stroke: 0.7px #000000;
        }
        .receipt-tender-header {
          font-size: 11.5px !important;
          font-weight: 900 !important;
          -webkit-text-stroke: 0.4px #000000;
        }
        .receipt-tender-row .tender-label {
          font-size: 13px !important;
          font-weight: 900 !important;
          -webkit-text-stroke: 0.45px #000000;
        }
        .receipt-tender-row .tender-amount {
          font-size: 16.5px !important;
          font-weight: 900 !important;
          -webkit-text-stroke: 0.65px #000000;
        }
        .receipt-tender-total .tender-total-label {
          font-size: 14px !important;
          font-weight: 900 !important;
          -webkit-text-stroke: 0.5px #000000;
        }
        .receipt-tender-total .tender-total-amount {
          font-size: 19px !important;
          font-weight: 900 !important;
          -webkit-text-stroke: 0.75px #000000;
        }
        .receipt-policy {
          font-weight: 800 !important;
          color: #000000 !important;
        }
        .receipt-brand {
          font-weight: 800 !important;
          color: #000000 !important;
        }
      `
      : '';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Receipt</title>
          <style>
            @page {
              size: 58mm auto;
              margin: 0mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: none !important;
              font-smooth: never !important;
              text-rendering: geometricPrecision !important;
              image-rendering: pixelated !important;
              color: #000000 !important;
            }
            html, body {
              width: 56mm;
              max-width: 56mm;
              margin: 0 auto;
              padding: 1.5mm 1mm;
              font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
              font-size: 10px;
              line-height: 1.25;
              color: #000000;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              word-break: break-word;
            }
            hr {
              border: 0;
              border-top: 1.5px dashed #000000 !important;
              margin: 3px 0;
            }
            .receipt-title {
              font-size: 12px;
              font-weight: 700;
              text-align: center;
              line-height: 1.15;
              text-transform: uppercase;
              color: #000000 !important;
            }
            .receipt-sub {
              font-size: 8.5px;
              text-align: center;
              color: #000000 !important;
            }
            .receipt-row {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
            }
            .receipt-net-payable {
              display: flex !important;
              justify-content: space-between !important;
              align-items: baseline !important;
              padding: 2.5px 0 !important;
              margin: 2px 0 !important;
              width: 100% !important;
            }
            .receipt-net-payable .net-label {
              font-size: 13px !important;
              font-weight: 900 !important;
              letter-spacing: 0.4px !important;
              color: #000000 !important;
              text-transform: uppercase !important;
            }
            .receipt-net-payable .net-amount {
              font-size: 17.5px !important;
              font-weight: 900 !important;
              letter-spacing: -0.3px !important;
              color: #000000 !important;
            }
            .receipt-tender-block {
              margin: 3px 0 !important;
              padding: 1px 0 !important;
              width: 100% !important;
            }
            .receipt-tender-header {
              font-size: 11px !important;
              font-weight: 900 !important;
              letter-spacing: 0.3px !important;
              margin-bottom: 2px !important;
              text-transform: uppercase !important;
            }
            .receipt-tender-row {
              display: flex !important;
              justify-content: space-between !important;
              align-items: baseline !important;
              padding: 1.5px 0 !important;
              width: 100% !important;
            }
            .receipt-tender-row .tender-label {
              font-size: 12.5px !important;
              font-weight: 800 !important;
              color: #000000 !important;
              letter-spacing: 0.2px !important;
            }
            .receipt-tender-row .tender-amount {
              font-size: 15.5px !important;
              font-weight: 900 !important;
              color: #000000 !important;
              letter-spacing: -0.2px !important;
              white-space: nowrap !important;
            }
            .receipt-tender-total {
              display: flex !important;
              justify-content: space-between !important;
              align-items: baseline !important;
              border-top: 1.5px dashed #000000 !important;
              margin-top: 3px !important;
              padding-top: 3px !important;
              padding-bottom: 1.5px !important;
              width: 100% !important;
            }
            .receipt-tender-total .tender-total-label {
              font-size: 13.5px !important;
              font-weight: 900 !important;
              color: #000000 !important;
              text-transform: uppercase !important;
            }
            .receipt-tender-total .tender-total-amount {
              font-size: 18px !important;
              font-weight: 900 !important;
              color: #000000 !important;
              letter-spacing: -0.3px !important;
              white-space: nowrap !important;
            }
            .receipt-tender-gst {
              display: flex !important;
              justify-content: space-between !important;
              align-items: baseline !important;
              font-size: 8.5px !important;
              color: #000000 !important;
              font-weight: 700 !important;
              margin-top: 2px !important;
              width: 100% !important;
            }
            .receipt-table-header {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 2px 0;
              font-weight: 700;
              font-size: 9px;
            }
            .text-center, .receipt-center, .receipt-footer, .upi-receipt-qr-block {
              text-align: center !important;
              margin-left: auto !important;
              margin-right: auto !important;
              width: 100% !important;
            }
            .receipt-footer *, .upi-receipt-qr-block * {
              text-align: center !important;
            }
            .upi-receipt-qr-block {
              margin: 3px auto !important;
              padding: 1px 0 !important;
            }
            .code-container {
              display: flex !important;
              flex-direction: column !important;
              align-items: center !important;
              justify-content: center !important;
              text-align: center !important;
              margin: 4px auto 2px auto !important;
              width: 100% !important;
            }
            .qr-wrapper {
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              text-align: center !important;
              margin: 3px auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              width: 100% !important;
            }
            .qr-wrapper svg,
            .upi-receipt-qr-block svg,
            .google-review-receipt-block svg {
              display: block !important;
              margin: 0 auto !important;
              width: 38mm !important;
              height: 38mm !important;
              max-width: 90% !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .invoice-barcode-top svg,
            .code-container svg,
            svg {
              display: block !important;
              margin: 0 auto !important;
              max-width: 100% !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            svg rect, svg path {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .code-label {
              display: block !important;
              text-align: center !important;
              font-size: 8.5px !important;
              font-family: 'JetBrains Mono', 'Courier New', Courier, monospace !important;
              font-weight: 700 !important;
              letter-spacing: 0.5px !important;
              margin: 2px auto 0 auto !important;
              width: 100% !important;
            }
            .receipt-policy {
              display: block !important;
              text-align: center !important;
              font-size: 7.5px !important;
              line-height: 1.25 !important;
              color: #222222 !important;
              padding: 0 1mm !important;
              margin: 3px auto !important;
              width: 100% !important;
            }
            .receipt-thanks {
              display: block !important;
              text-align: center !important;
              font-size: 9.5px !important;
              font-weight: 800 !important;
              letter-spacing: 0.5px !important;
              margin: 3px auto 1px auto !important;
              width: 100% !important;
            }
            .receipt-brand {
              display: block !important;
              text-align: center !important;
              font-size: 7.5px !important;
              color: #444444 !important;
              margin: 1px auto 0 auto !important;
              width: 100% !important;
            }
            .no-print {
              display: none !important;
            }
            svg {
              display: block !important;
              margin: 0 auto !important;
            }
            ${boldCss}
          </style>
        </head>
        <body class="${boldActive ? 'thermal-bold' : ''}">
          ${receiptHtml}
        </body>
      </html>
    `);
    doc.close();

    // Give iframe time to load content and SVG barcodes, then focus and trigger print
    setTimeout(() => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } else {
          window.focus();
          window.print();
        }
      } catch (err) {
        console.warn('Iframe print failed, falling back to window.print:', err);
        window.focus();
        window.print();
      }
    }, 350);
  } catch (error) {
    console.error('Print utility error:', error);
    window.focus();
    window.print();
  }
}

/**
 * Dedicated high-precision 50mm x 32mm clothing price tag printing utility.
 * Creates an isolated, zero-margin printable iframe specifically sized to 50x32mm labels.
 * Guarantees exact 1:1 match with UI preview:
 * - Proper @page { size: 50mm 32mm; margin: 0; }
 * - Zero font-weight/stroke distortion (no blotchy text)
 * - Zero extra margins or dashed borders
 * - Strict per-tag page break so each tag prints on its own physical sticker
 */
export function printPriceTagsHtml(tagsHtml: string) {
  try {
    // 1. Mount point for DOM / fallback print
    let printMount = document.getElementById('print-mount-point');
    if (!printMount) {
      printMount = document.createElement('div');
      printMount.id = 'print-mount-point';
      printMount.className = 'no-print';
      printMount.style.display = 'none';
      document.body.appendChild(printMount);
    }
    printMount.innerHTML = tagsHtml;
    printMount.classList.add('is-tag-print');
    printMount.classList.remove('thermal-bold');

    // 2. Dedicated hidden iframe for tags
    let iframe = document.getElementById('price-tag-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'price-tag-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      window.focus();
      window.print();
      return;
    }

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Apparel Price Tags</title>
          <style>
            @page {
              size: 50mm 32mm;
              margin: 0mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            html, body {
              width: 50mm;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              color: #000000;
              -webkit-font-smoothing: antialiased;
            }
            .space-y-3 > * + * {
              margin-top: 0 !important;
            }
            .thermal-tag-roll {
              width: 50mm !important;
              height: 32mm !important;
              max-width: 50mm !important;
              max-height: 32mm !important;
              min-width: 50mm !important;
              min-height: 32mm !important;
              padding: 1.5mm 1.8mm !important;
              box-sizing: border-box !important;
              background: #ffffff !important;
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              overflow: hidden !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .thermal-tag-roll:last-of-type {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            svg {
              display: block !important;
              margin: 0 auto !important;
              max-width: 100% !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              shape-rendering: crispEdges !important;
            }
            svg rect, svg path {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body>
          ${tagsHtml}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } else {
          window.focus();
          window.print();
        }
      } catch (err) {
        console.warn('Tag iframe print failed, falling back to window.print:', err);
        window.focus();
        window.print();
      }
    }, 350);
  } catch (error) {
    console.error('Print price tags error:', error);
    window.focus();
    window.print();
  }
}
