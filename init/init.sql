CREATE TABLE "Chat" (
    "chatID" SERIAL PRIMARY KEY,
    "establishTime" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 

CREATE TABLE "Message" (
    "messageID" SERIAL PRIMARY KEY,
    "chatID" INTEGER NOT NULL REFERENCES "Chat"("chatID"),
    "sender" VARCHAR(100) NOT NULL, -- Wer hat die Nachricht gesendet (z.B. 'user', 'orchestrator', 'PerformanceAgent')
    "content" TEXT,
    "time" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_message_chat_time ON "Message"("chatID", "time" ASC);

CREATE TABLE "IsProcess" (
    "IsProcessID" SERIAL PRIMARY KEY,
    "chatID" INTEGER NOT NULL REFERENCES "Chat"("chatID"),
    "caseID" INTEGER NOT NULL,
    "activity" VARCHAR(200) NOT NULL,
    "startTime" TIMESTAMP WITH TIME ZONE,
    -- Wenn endTime nicht vorhanden ist, muss dies vom PM4Py-Skript abgeleitet und gefüllt werden.
    "endTime" TIMESTAMP WITH TIME ZONE,
    "resource" VARCHAR(100),
    "cost" FLOAT
);