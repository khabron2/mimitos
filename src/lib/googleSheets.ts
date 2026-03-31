import { Product, AppSettings } from '../types';

/**
 * GOOGLE APPS SCRIPT (GAS) - Copia este código en tu Google Apps Script:
 * 
 * const SHEET_ID = 'TU_ID_DE_HOJA';
 * const FOLDER_ID = 'TU_ID_DE_CARPETA_IMAGENES'; // Crea una carpeta en Drive y pega su ID aquí
 * 
 * function doGet(e) {
 *   const ss = SpreadsheetApp.openById(SHEET_ID);
 *   const sheet = ss.getSheetByName('BaseDatos');
 *   const data = sheet.getDataRange().getValues();
 *   const headers = data[0];
 *   const rows = data.slice(1);
 *   
 *   const result = rows.map((row, index) => {
 *     let obj = { id: (index + 2).toString() };
 *     headers.forEach((header, i) => {
 *       obj[header] = row[i];
 *     });
 *     return obj;
 *   });
 *   
 *   return ContentService.createTextOutput(JSON.stringify(result))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 * 
 * function doPost(e) {
 *   const params = JSON.parse(e.postData.contents);
 *   const ss = SpreadsheetApp.openById(SHEET_ID);
 *   
 *   if (params.action === 'login') {
 *     const sheet = ss.getSheetByName('Usuarios');
 *     const data = sheet.getDataRange().getValues();
 *     const user = params.user;
 *     const pass = params.pass;
 *     
 *     const found = data.slice(1).find(row => row[0] == user && row[1] == pass);
 *     return ContentService.createTextOutput(JSON.stringify({ success: !!found }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 *   
 *   if (params.action === 'uploadImage') {
 *     const folder = DriveApp.getFolderById(FOLDER_ID);
 *     const contentType = params.mimeType;
 *     const data = Utilities.base64Decode(params.base64);
 *     const blob = Utilities.newBlob(data, contentType, params.filename);
 *     const file = folder.createFile(blob);
 *     file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
 *     
 *     return ContentService.createTextOutput(JSON.stringify({ 
 *       success: true, 
 *       url: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w1000` 
 *     })).setMimeType(ContentService.MimeType.JSON);
 *   }
 *   
 *   if (params.action === 'updateStock') {
 *     const sheet = ss.getSheetByName('BaseDatos');
 *     const row = parseInt(params.id);
 *     const headers = sheet.getDataRange().getValues()[0];
 *     const stockCol = headers.indexOf('STOCK') + 1;
 *     sheet.getRange(row, stockCol).setValue(params.stock);
 *     return ContentService.createTextOutput(JSON.stringify({ success: true }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * 
 *   if (params.action === 'saveProduct') {
 *     const sheet = ss.getSheetByName('BaseDatos');
 *     const headers = sheet.getDataRange().getValues()[0];
 *     const product = params.product;
 *     
 *     if (params.id) { // Update
 *       const row = parseInt(params.id);
 *       headers.forEach((header, i) => {
 *         if (product[header] !== undefined) {
 *           sheet.getRange(row, i + 1).setValue(product[header]);
 *         }
 *       });
 *     } else { // Add
 *       const newRow = headers.map(h => product[h] || '');
 *       sheet.appendRow(newRow);
 *     }
 *     return ContentService.createTextOutput(JSON.stringify({ success: true }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * 
 *   if (params.action === 'deleteProduct') {
 *     const sheet = ss.getSheetByName('BaseDatos');
 *     sheet.deleteRow(parseInt(params.id));
 *     return ContentService.createTextOutput(JSON.stringify({ success: true }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * 
 *   if (params.action === 'fetchSettings') {
 *     const sheet = ss.getSheetByName('Config');
 *     const data = sheet.getDataRange().getValues();
 *     return ContentService.createTextOutput(JSON.stringify({ 
 *       shippingPrice: data[1][0],
 *       whatsappNumber: data[1][1]
 *     })).setMimeType(ContentService.MimeType.JSON);
 *   }
 * 
 *   if (params.action === 'updateSettings') {
 *     const sheet = ss.getSheetByName('Config');
 *     sheet.getRange(2, 1).setValue(params.shippingPrice);
 *     sheet.getRange(2, 2).setValue(params.whatsappNumber);
 *     return ContentService.createTextOutput(JSON.stringify({ success: true }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * 
 *   if (params.action === 'recordSale') {
 *     const sheet = ss.getSheetByName('Ventas');
 *     const { nombre, domicilio, pedido, total, fecha } = params;
 *     sheet.appendRow([nombre, domicilio, pedido, total, fecha]);
 *     return ContentService.createTextOutput(JSON.stringify({ success: true }))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * 
 *   if (params.action === 'fetchSales') {
 *     const sheet = ss.getSheetByName('Ventas');
 *     const data = sheet.getDataRange().getValues();
 *     const headers = data[0];
 *     const rows = data.slice(1);
 *     const result = rows.map((row) => {
 *       let obj = {};
 *       headers.forEach((header, i) => {
 *         obj[header] = row[i];
 *       });
 *       return obj;
 *     });
 *     return ContentService.createTextOutput(JSON.stringify(result))
 *       .setMimeType(ContentService.MimeType.JSON);
 *   }
 * 
 *   return ContentService.createTextOutput(JSON.stringify({ success: false }))
 *     .setMimeType(ContentService.MimeType.JSON);
 * }
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwlbyu4E_f-67kqR5gOBNgvvX16r2-DINgzw4VqYPHOqmKvrffV89QNYQCWj1g7A5K4/exec';

function fixGoogleDriveUrl(url: string): string {
  if (!url) return '';
  const trimmedUrl = url.trim();
  const driveIdRegex = /(?:\/file\/d\/|id=)([\w-]+)/;
  const match = trimmedUrl.match(driveIdRegex);
  if (match && match[1]) {
    const id = match[1];
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
  }
  return trimmedUrl;
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${GAS_URL}?t=${Date.now()}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map((p: any) => {
      const normalized: any = {};
      Object.keys(p).forEach(key => {
        const upperKey = key.trim().toUpperCase();
        normalized[upperKey] = p[key];
      });

      return {
        id: p.id,
        CATEGORIA: normalized.CATEGORIA || '',
        PRODUCTO: normalized.PRODUCTO || '',
        CARACTERISTICAS: normalized.CARACTERISTICAS || '',
        PRECIO: parseFloat(normalized.PRECIO) || 0,
        TALLE: normalized.TALLE || '',
        STOCK: parseInt(normalized.STOCK) || 0,
        IMG: fixGoogleDriveUrl(normalized.IMG || ''),
        IMG2: fixGoogleDriveUrl(normalized.IMG2 || ''),
        IMG3: fixGoogleDriveUrl(normalized.IMG3 || ''),
        OFERTA: parseInt(normalized.OFERTA) || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching products details:', error);
    // Re-throw to allow component to handle it if needed, or return empty array
    return [];
  }
}

export async function login(user: string, pass: string): Promise<boolean> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ action: 'login', user, pass }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error login details:', error);
    return false;
  }
}

export async function saveProduct(product: Partial<Product>, id?: string): Promise<boolean> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ action: 'saveProduct', product, id }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error saving product details:', error);
    return false;
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ action: 'deleteProduct', id }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error deleting product details:', error);
    return false;
  }
}

export async function fetchSettings(): Promise<AppSettings> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ action: 'fetchSettings' }),
    });
    const data = await response.json();
    return {
      shippingPrice: parseFloat(data.shippingPrice) || 0,
      whatsappNumber: String(data.whatsappNumber || '')
    };
  } catch (error) {
    console.error('Error fetching settings details:', error);
    return { shippingPrice: 3000, whatsappNumber: '3834465044' };
  }
}

export async function updateSettings(settings: AppSettings): Promise<boolean> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ action: 'updateSettings', ...settings }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error updating settings details:', error);
    return false;
  }
}

export async function updateStock(id: string, newStock: number): Promise<boolean> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ action: 'updateStock', id, stock: newStock }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error updating stock details:', error);
    return false;
  }
}

export async function recordSale(sale: { nombre: string, domicilio: string, pedido: string, total: number, fecha: string }): Promise<boolean> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ action: 'recordSale', ...sale }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('Error recording sale details:', error);
    return false;
  }
}

export async function fetchSales(): Promise<any[]> {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({ action: 'fetchSales' }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error fetching sales details:', error);
    return [];
  }
}

export async function uploadImage(file: File): Promise<string | null> {
  try {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
    });
    reader.readAsDataURL(file);
    const base64 = await base64Promise;

    const response = await fetch(GAS_URL, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      body: JSON.stringify({
        action: 'uploadImage',
        filename: file.name,
        mimeType: file.type,
        base64
      }),
    });
    const result = await response.json();
    return result.success ? result.url : null;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}
