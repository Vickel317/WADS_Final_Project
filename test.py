import numpy as np
import matplotlib.pyplot as plt

x = np.linspace(-10,10,100)
y = np.linspace(-10,10,100)

X,Y = np.meshgrid(x,y)
Z = -X**2 + X*Y + Y**2

plt.contourf(X,Y,Z)
plt.colorbar()

plt.show()
