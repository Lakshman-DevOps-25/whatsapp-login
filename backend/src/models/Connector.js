const mongoose = require('mongoose');
const crypto   = require('crypto');

const ENC_KEY = (process.env.ENCRYPTION_KEY || 'default_32_char_key_padding!!!!!!').substring(0, 32);
const IV_LEN  = 16;

function encrypt(text) {
  if (!text) return null;
  const iv  = crypto.randomBytes(IV_LEN);
  const c   = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
  const enc = Buffer.concat([c.update(text), c.final()]);
  return iv.toString('hex') + ':' + enc.toString('hex');
}

function decrypt(text) {
  if (!text) return null;
  try {
    const [ivHex, encHex] = text.split(':');
    const iv  = Buffer.from(ivHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const d   = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY), iv);
    return Buffer.concat([d.update(enc), d.final()]).toString();
  } catch { return null; }
}

const connectorSchema = new mongoose.Schema({
  connectorType: { type: String, required: true },
  connectorName: { type: String, required: true },
  status:        { type: String, default: 'PENDING', enum: ['PENDING','ACTIVE','ERROR','DISCONNECTED'] },
  // OAuth credentials — stored encrypted
  accessToken:   { type: String, default: null },
  refreshToken:  { type: String, default: null },
  tokenExpiresAt:{ type: Date,   default: null },
  // WhatsApp-specific
  wabaId:        { type: String, default: null },
  phoneNumberId: { type: String, default: null },
  displayPhone:  { type: String, default: null },
  verifiedName:  { type: String, default: null },
  qualityRating: { type: String, default: null },
  // Meta information
  providerAccountId:   { type: String, default: null },
  providerAccountName: { type: String, default: null },
  scopes:  { type: [String], default: [] },
  config:  { type: Object,  default: {} },
  metadata:{ type: Object,  default: {} },
}, { timestamps: true });

// Encrypt tokens before save
connectorSchema.pre('save', function (next) {
  if (this.isModified('accessToken')  && this.accessToken  && !this.accessToken.includes(':'))
    this.accessToken  = encrypt(this.accessToken);
  if (this.isModified('refreshToken') && this.refreshToken && !this.refreshToken.includes(':'))
    this.refreshToken = encrypt(this.refreshToken);
  next();
});

connectorSchema.methods.getAccessToken  = function () { return decrypt(this.accessToken);  };
connectorSchema.methods.getRefreshToken = function () { return decrypt(this.refreshToken); };

module.exports = mongoose.model('Connector', connectorSchema);
