// Factorial function implementation for GitHub issue #2

/**
 * Calculates the factorial of a non-negative integer
 * @param {number} n - The number to calculate factorial for
 * @returns {number} The factorial of n (n!)
 * @throws {Error} If n is negative or not an integer
 */
function factorial(n) {
  // Validate input
  if (typeof n !== 'number' || !Number.isInteger(n)) {
    throw new Error('Input must be an integer');
  }
  
  if (n < 0) {
    throw new Error('Factorial is not defined for negative numbers');
  }
  
  // Base cases: factorial of 0 or 1 is 1
  if (n === 0 || n === 1) {
    return 1;
  }
  
  // Recursive calculation: n! = n * (n-1)!
  return n * factorial(n - 1);
}

// Export the function for use in other modules
module.exports = factorial;