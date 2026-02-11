import numpy as np  # Import NumPy for array creation and math operations
import matplotlib  # Import Matplotlib base module
matplotlib.use("Agg")  # Use a non-interactive backend for saving images
import matplotlib.pyplot as plt  # Import pyplot for plotting
from mpl_toolkits.mplot3d import Axes3D  # Enable 3D plotting support

x = np.linspace(-10, 10, 100)  # Create 100 x-values from -10 to 10
y = np.linspace(-10, 10, 100)  # Create 100 y-values from -10 to 10

X, Y = np.meshgrid(x, y)  # Create 2D grids from x and y

Z = -X**2 + X*Y + Y**2  # Compute Z values for the surface

fig = plt.figure()  # Create a new figure
ax = fig.add_subplot(111, projection="3d")  # Add a 3D subplot

ax.plot_surface(X, Y, Z, cmap="viridis")  # Plot the surface with a colormap

ax.set_xlabel("X")  # Label the X axis
ax.set_ylabel("Y")  # Label the Y axis
ax.set_zlabel("Z")  # Label the Z axis

output_path = "surface_plot.png"  # Define the output image path
plt.savefig(output_path, dpi=200, bbox_inches="tight")  # Save the figure to file
plt.close(fig)  # Close the figure to free resources
print(f"Saved plot to {output_path}")  # Print a confirmation message
