FROM --platform=linux/x86_64 node:18.15.0-slim

RUN apt-get update && \
    apt-get install -y locales git procps vim tmux curl openssl
RUN locale-gen ja_JP.UTF-8
RUN localedef -f UTF-8 -i ja_JP ja_JP
ENV LANG=ja_JP.UTF-8
ENV TZ=Asia/Tokyo

WORKDIR /app

# 🔴 1. 依存関係のファイルを先にコピー
COPY package*.json ./
COPY prisma ./prisma/

# 🔴 2. 【超重要】ここでビルド引数（ARG）として受け取り、環境変数（ENV）に変換する
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# 🔴 3. この状態でインストールと生成を行うことで、Prismaが空文字エラーにならなくなります
RUN yarn install
RUN npx prisma generate

# 4. 残りのコードをコピー
COPY . /app

CMD ["sh", "-c", "npx prisma migrate deploy && node index.js"]