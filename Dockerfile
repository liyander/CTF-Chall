
# Use the official lightweight Node.js 14 image.
# https://hub.docker.com/_/node
FROM node:18-slim

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure both package.json AND package-lock.json are copied.
# Copying this separately prevents re-running npm install on every code change.
COPY package*.json ./

# Install production dependencies.
RUN npm install

# Copy local code to the container image.
COPY . .

# Create the flag file
RUN echo "CTF{Pr0t0typ3_P0llut10n_1s_N0t_D34d_Just_Curs3d}" > /flag.txt
# Make flag unreadable by default, but we are running as root in container usually.
# For better CTF hygiene:
# RUN useradd -m ctf
# USER ctf
# But we need to make sure we can read it via RCE. RCE usually runs as the user running node.
# So if node runs as root, easy. If node runs as ctf, and flag is owned by root?
# Standard: Flag readable by user or there's a setuid binary.
# SImplest RCE proof: cat /flag.txt.
# Ensure permission
RUN chmod 644 /flag.txt

# Run the web service on container startup.
CMD [ "node", "server.js" ]

EXPOSE 3000
