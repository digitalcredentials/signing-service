import * as cborld from '@digitalcredentials/cborld';
import {createPresentation} from '@digitalcredentials/vc';
import base32Encode from 'base32-encode';
import QRCode from 'qrcode';

const VP_QR_VERSION = 'VP1';
const BASE_32_UPPERCASE_MULTIBASE_PREFIX = 'B';

async function makeQrCode(verifiableCredential, documentLoader) {
  const verifiablePresentation = await createPresentation({ verifiableCredential });
  const cborldBytes = await cborld.encode({jsonldDocument: verifiablePresentation, documentLoader});
  const encoded = base32Encode(cborldBytes, 'RFC4648', {padding: false});
  const payload =`${VP_QR_VERSION}-${BASE_32_UPPERCASE_MULTIBASE_PREFIX}${encoded}`;
  const imageDataUrl = await QRCode.toDataURL(payload);
  return imageDataUrl;
}
