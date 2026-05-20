// Monkey-patch BigInt to allow seamless JSON serialization of Prisma objects.
BigInt.prototype.toJSON = function () {
  const num = Number(this);
  if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
    return this.toString();
  }
  return num;
};

module.exports = {};
