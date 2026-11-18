BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "cliente" (
	"id"	INTEGER,
	"nome"	TEXT NOT NULL,
	"email"	TEXT NOT NULL UNIQUE,
	"senha"	TEXT NOT NULL,
	"whatsapp"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "comerciante" (
	"id"	INTEGER,
	"nome"	TEXT NOT NULL,
	"email"	TEXT NOT NULL UNIQUE,
	"senha"	TEXT NOT NULL,
	"nome_comercio"	TEXT,
	"endereco"	TEXT,
	"telefone"	TEXT,
	"horario"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);
CREATE TABLE IF NOT EXISTS "item_pedido" (
	"id"	INTEGER,
	"pedido_id"	INTEGER NOT NULL,
	"produto_id"	INTEGER NOT NULL,
	"quantidade"	INTEGER NOT NULL CHECK("quantidade" > 0),
	"preco_unitario"	REAL NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("pedido_id") REFERENCES "pedido"("id"),
	FOREIGN KEY("produto_id") REFERENCES "produto"("id")
);
CREATE TABLE IF NOT EXISTS "pedido" (
	"id"	INTEGER,
	"cliente_id"	INTEGER NOT NULL,
	"recebimento"	TEXT NOT NULL CHECK("recebimento" IN ('entrega', 'retirada')),
	"endereco_entrega"	TEXT,
	"bairro"	TEXT,
	"taxa_entrega"	REAL NOT NULL DEFAULT 0,
	"observacao"	TEXT,
	"forma_pagamento"	TEXT CHECK("forma_pagamento" IN ('pix', 'dinheiro', 'cartao')),
	"troco_para"	REAL,
	"pago"	INTEGER NOT NULL DEFAULT 0 CHECK("pago" IN (0, 1)),
	"codigo_entrega"	TEXT,
	"total"	REAL NOT NULL,
	"status"	TEXT NOT NULL DEFAULT 'pendente' CHECK("status" IN ('pendente', 'preparando', 'pronto', 'concluido', 'cancelado')),
	"data"	TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	FOREIGN KEY("cliente_id") REFERENCES "cliente"("id"),
	CHECK("recebimento" = 'retirada' OR "endereco_entrega" IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS "produto" (
	"id"	INTEGER,
	"nome"	TEXT NOT NULL,
	"descricao"	TEXT,
	"preco"	REAL NOT NULL CHECK("preco" > 0),
	"peso"	REAL,
	"categoria"	TEXT,
	"disponivel"	INTEGER NOT NULL DEFAULT 1 CHECK("disponivel" IN (0, 1)),
	"imagem"	TEXT,
	PRIMARY KEY("id" AUTOINCREMENT)
);
INSERT INTO "produto" VALUES (1,'Carvão vegetal','Pacote prático para o churrasco de fim de semana. Acende rápido e garante brasa firme para a família.',18.0,3.0,'Tradicional',1,'assets/img/produto-tradicional-3kg.jpg');
INSERT INTO "produto" VALUES (2,'Carvão vegetal','O tamanho certo para reunir a turma ao redor da churrasqueira. Carvão selecionado em pedaços, com brasa duradoura para você aproveitar cada momento.',28.0,5.0,'Tradicional',1,'assets/img/produto-tradicional-5kg.jpg');
INSERT INTO "produto" VALUES (3,'Carvão vegetal','Pacote prático para o churrasco de fim de semana. Acende rápido e garante brasa firme para a família.',18.0,5.0,'Misto',1,'assets/img/produto-misto-5kg.jpeg');
INSERT INTO "produto" VALUES (4,'Carvão vegetal','Pacote prático para o churrasco de fim de semana. Acende rápido e garante brasa firme para a família.',18.0,10.0,'Misto',0,'assets/img/produto-misto-10kg.jpeg');
INSERT INTO "produto" VALUES (5,'Carvão vegetal premium','Um pacote maior para churrascos que pedem mais tempo de brasa. Carvão selecionado em pedaços grandes, pensado para encontros com a turma toda.',52.0,10.0,'Premium',1,'assets/img/produto-premium-10kg.jpeg');
COMMIT;
