#EXERCISE 1.2.
def gcd(m,n ):
    if n ==0:
        return m
    else:
        return gcd(n, m % n)
    
result = gcd(108,192)
print(f"The GCD of 108 and 192 is: {result}")

#EXERCISE 1.3.
import math

h = float(input("Enter the height of the tower in meters: "))
g = 9.8  # Acceleration due to gravity in m/s^2
t = math.sqrt((2 * h) / g)
print(f"The time taken for the object to fall from the tower is {t:.2f} seconds.")
