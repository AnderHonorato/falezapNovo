-- CreateTable
CREATE TABLE "posts_blog" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT NOT NULL,

    CONSTRAINT "posts_blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios_blog" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autorId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "comentarios_blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes_blog" (
    "id" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "likes_blog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "posts_blog_slug_key" ON "posts_blog"("slug");

-- CreateIndex
CREATE INDEX "comentarios_blog_postId_idx" ON "comentarios_blog"("postId");

-- CreateIndex
CREATE INDEX "likes_blog_postId_idx" ON "likes_blog"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "likes_blog_usuarioId_postId_key" ON "likes_blog"("usuarioId", "postId");

-- AddForeignKey
ALTER TABLE "posts_blog" ADD CONSTRAINT "posts_blog_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_blog" ADD CONSTRAINT "comentarios_blog_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_blog" ADD CONSTRAINT "comentarios_blog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts_blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes_blog" ADD CONSTRAINT "likes_blog_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes_blog" ADD CONSTRAINT "likes_blog_postId_fkey" FOREIGN KEY ("postId") REFERENCES "posts_blog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
