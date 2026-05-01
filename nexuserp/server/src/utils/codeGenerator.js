const crypto = require('crypto');

const buildSegment = (length) =>
  crypto.randomBytes(Math.ceil(length / 2)).toString('hex').toUpperCase().slice(0, length);

async function generateUniqueCode({ prisma, model, field, prefix = '', separator = '', length = 6, maxAttempts = 10 }) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = `${prefix}${separator}${buildSegment(length)}`;
    const exists = await prisma[model].findUnique({
      where: { [field]: candidate },
      select: { [field]: true }
    });
    if (!exists) return candidate;
  }

  throw new Error(`Unable to generate unique code for ${model}.${field}`);
}

module.exports = { generateUniqueCode };
