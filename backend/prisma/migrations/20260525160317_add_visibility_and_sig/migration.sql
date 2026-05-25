BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Certificate] ADD [userId] INT;

-- AlterTable
ALTER TABLE [dbo].[User] ADD [signatureUrl] NVARCHAR(1000);

-- AddForeignKey
ALTER TABLE [dbo].[Certificate] ADD CONSTRAINT [Certificate_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
