# Chọn môi trường Node chính thức
FROM node:22

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy file package.json để cài lib trước
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ code vào container
COPY . .

# Mở port 3000 (hoặc port server bạn dùng)
EXPOSE 8080

# Lệnh chạy khi container start
CMD ["node", "server.js"]
