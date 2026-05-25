BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Certificate] (
    [id] INT NOT NULL IDENTITY(1,1),
    [numerCertyfikatu] NVARCHAR(1000) NOT NULL,
    [numerUmowy] NVARCHAR(1000) NOT NULL,
    [daneKlienta] NVARCHAR(1000) NOT NULL,
    [dataWystawienia] DATETIME2 NOT NULL CONSTRAINT [Certificate_dataWystawienia_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Certificate_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Certificate_numerCertyfikatu_key] UNIQUE NONCLUSTERED ([numerCertyfikatu])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] INT NOT NULL IDENTITY(1,1),
    [username] NVARCHAR(1000) NOT NULL,
    [password] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'USER',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_username_key] UNIQUE NONCLUSTERED ([username])
);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
