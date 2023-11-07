export default function SigningException(code, message, stack) {
  this.code = code
  this.message = message
  this.stack = stack
}
