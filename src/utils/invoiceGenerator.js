import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates and downloads a professional B2B invoice PDF.
 * @param {Object} order - The order data object.
 * @param {String} letterheadUrl - Optional URL for the letterhead image.
 */
export const downloadInvoice = async (order, letterheadUrl = null) => {
  // Create a hidden div for the invoice
  const invoiceElement = document.createElement('div');
  invoiceElement.id = 'invoice-template';
  invoiceElement.style.width = '800px';
  invoiceElement.style.padding = '0';
  invoiceElement.style.position = 'fixed';
  invoiceElement.style.top = '-10000px';
  invoiceElement.style.left = '-10000px';
  invoiceElement.style.backgroundColor = 'white';
  invoiceElement.style.fontFamily = "'Inter', 'Segoe UI', Roboto, sans-serif";
  invoiceElement.style.color = '#1e293b';

  const subtotal = order.total / 1.18;
  const gst = order.total - subtotal;

  invoiceElement.innerHTML = `
    <div style="position: relative; width: 100%; min-height: 1120px;">
      <!-- Letterhead Background / Header -->
      ${letterheadUrl ? 
        `<img src="${letterheadUrl}" style="position: absolute; top: 0; left: 0; width: 100%; z-index: 0;" />` : 
        `<div style="height: 120px; background: linear-gradient(90deg, #0f172a 0%, #1e293b 100%); display: flex; align-items: center; padding: 0 50px; color: white;">
           <h1 style="margin: 0; font-size: 24px; letter-spacing: 2px;">FINE BEARING & OIL SEAL STORE</h1>
         </div>`
      }

      <div style="position: relative; z-index: 1; padding: 50px; margin-top: ${letterheadUrl ? '150px' : '20px'};">
        <div style="display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px;">
          <div>
            <h2 style="font-size: 32px; font-weight: 900; margin: 0; color: #0f172a;">INVOICE</h2>
            <p style="margin: 5px 0; color: #64748b; font-weight: 600;"># ${order.orderId}</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-weight: 700;">Date: ${new Date(order.createdAt || order.date).toLocaleDateString()}</p>
            <p style="margin: 5px 0; color: #ea580c; font-weight: 700;">Status: PAID</p>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px;">
          <div>
            <h4 style="text-transform: uppercase; color: #94a3b8; font-size: 12px; margin-bottom: 10px; letter-spacing: 1px;">Bill To:</h4>
            <p style="margin: 0; font-weight: 800; font-size: 16px;">${order.shippingAddress?.fullName || 'Valued Customer'}</p>
            <p style="margin: 3px 0; color: #475569;">${order.shippingAddress?.street || ''}</p>
            <p style="margin: 3px 0; color: #475569;">${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.zip || ''}</p>
            <p style="margin: 3px 0; color: #475569;">Phone: ${order.shippingAddress?.phone || ''}</p>
            ${order.shippingAddress?.gstNumber ? `<p style="margin: 3px 0; color: #0f172a; font-weight: 700;">GSTIN: ${order.shippingAddress.gstNumber}</p>` : ''}
          </div>
          <div style="text-align: right;">
            <h4 style="text-transform: uppercase; color: #94a3b8; font-size: 12px; margin-bottom: 10px; letter-spacing: 1px;">From:</h4>
            <p style="margin: 0; font-weight: 800; font-size: 16px;">Fine Bearing & Oil Seal Store</p>
            <p style="margin: 3px 0; color: #475569;">Link Rd. Dholewal, Ludhiana</p>
            <p style="margin: 3px 0; color: #475569;">Punjab, India - 141003</p>
            <p style="margin: 3px 0; color: #475569;">GSTIN: 03ABCDE1234F1Z5</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
              <th style="padding: 12px; text-align: left; font-size: 12px; color: #64748b;">DESCRIPTION</th>
              <th style="padding: 12px; text-align: center; font-size: 12px; color: #64748b;">QTY</th>
              <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b;">PRICE</th>
              <th style="padding: 12px; text-align: right; font-size: 12px; color: #64748b;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${(order.items || []).map(item => `
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 15px 12px; font-weight: 600;">${item.name}</td>
                <td style="padding: 15px 12px; text-align: center;">${item.quantity}</td>
                <td style="padding: 15px 12px; text-align: right;">₹${item.price?.toFixed(2) || (item.totalPrice / item.quantity).toFixed(2)}</td>
                <td style="padding: 15px 12px; text-align: right; font-weight: 700;">₹${item.totalPrice?.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 250px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #64748b;">
              <span>Subtotal</span>
              <span>₹${subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; color: #64748b;">
              <span>GST (18%)</span>
              <span>₹${gst.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #0f172a; font-weight: 900; font-size: 20px; color: #0f172a;">
              <span>Total</span>
              <span>₹${order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
          <div style="padding: 20px; background-color: #f8fafc; border-radius: 10px; font-size: 11px; line-height: 1.6; color: #64748b;">
            <h5 style="margin: 0 0 10px 0; color: #0f172a; font-size: 12px;">Terms & Conditions:</h5>
            <p style="margin: 0;">1. All disputes are subject to Ludhiana Jurisdiction.</p>
            <p style="margin: 0;">2. Goods once sold will not be taken back or exchanged.</p>
            <p style="margin: 0;">3. This is a computer-generated invoice and does not require a physical signature.</p>
          </div>
          <div style="text-align: center; display: flex; flex-direction: column; justify-content: flex-end; align-items: center;">
             <div style="width: 150px; border-bottom: 1px solid #1e293b; margin-bottom: 10px;"></div>
             <p style="margin: 0; font-size: 12px; font-weight: 700; color: #1e293b;">Authorized Signatory</p>
             <p style="margin: 0; font-size: 10px; color: #94a3b8;">Fine Bearing & Oil Seal Store</p>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(invoiceElement);

  try {
    const canvas = await html2canvas(invoiceElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: 'white'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width / 2, canvas.height / 2]
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`Invoice_${order.orderId}.pdf`);
  } catch (error) {
    console.error('Invoice Generation Error:', error);
    alert('Failed to generate invoice. Please try again.');
  } finally {
    document.body.removeChild(invoiceElement);
  }
};
