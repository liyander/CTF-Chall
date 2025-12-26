# Use the official lightweight Node.js 18 image.
# https://hub.docker.com/_/node
FROM node:18-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Create the flag file
RUN echo "CTF{Pr0t0typ3_P0llut10n_1s_N0t_D34d_Just_Curs3d}" > /flag.txt
RUN chmod 644 /flag.txt

# Create a non-root user 'ctf' and set permissions
RUN useradd -m ctf && \
    chown -R ctf:ctf /usr/src/app

# Switch to the non-root user
USER ctf

# Run the web service on container startup.
CMD [ "node", "server.js" ]

EXPOSE 3000
