const verificationCodes = new Map(); 

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
}

function storeCode(email, code) {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutos
  verificationCodes.set(email, { code, expiresAt });
}

function isValidCode(email, inputCode) {
  const entry = verificationCodes.get(email);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    verificationCodes.delete(email);
    return false;
  }
  return entry.code === inputCode;
}

function deleteCode(email) {
  verificationCodes.delete(email);
}

module.exports = {
  generateCode,
  storeCode,
  isValidCode,
  deleteCode,
};
