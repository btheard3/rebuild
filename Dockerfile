# Use NGINX to serve static files
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default NGINX static assets
RUN rm -rf ./*

# Copy exported site to nginx directory
COPY dist .

# Expose port 80
EXPOSE 80

# Start NGINX server
CMD ["nginx", "-g", "daemon off;"]
