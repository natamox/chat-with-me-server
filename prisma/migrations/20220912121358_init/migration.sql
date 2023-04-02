-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT,
    "avatar" TEXT,
    "create_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "create_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMPTZ NOT NULL
);

-- CreateTable
CREATE TABLE "app_configuration" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "appsecret" TEXT NOT NULL,
    "create_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "app_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_configuration" (
    "id" TEXT NOT NULL,
    "open_id" TEXT[],
    "template_name" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "template_content" JSONB[],
    "user_id" TEXT NOT NULL,
    "create_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "message_configuration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_content" (
    "id" TEXT NOT NULL,
    "message_data" JSONB NOT NULL,
    "user_id" TEXT NOT NULL,
    "message_configuration_id" TEXT NOT NULL,
    "create_time" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_time" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "message_content_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "partner_id_key" ON "partner"("id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_user_id_key" ON "partner"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "app_configuration_id_key" ON "app_configuration"("id");

-- CreateIndex
CREATE UNIQUE INDEX "app_configuration_user_id_key" ON "app_configuration"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_configuration_id_key" ON "message_configuration"("id");

-- CreateIndex
CREATE UNIQUE INDEX "message_configuration_template_id_key" ON "message_configuration"("template_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_content_id_key" ON "message_content"("id");

-- AddForeignKey
ALTER TABLE "partner" ADD CONSTRAINT "partner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "app_configuration" ADD CONSTRAINT "app_configuration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_configuration" ADD CONSTRAINT "message_configuration_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_content" ADD CONSTRAINT "message_content_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_content" ADD CONSTRAINT "message_content_message_configuration_id_fkey" FOREIGN KEY ("message_configuration_id") REFERENCES "message_configuration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
