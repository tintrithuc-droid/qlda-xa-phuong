IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [AuditLogs] (
        [Id] nvarchar(64) NOT NULL,
        [Ts] datetime2 NOT NULL,
        [UserId] nvarchar(64) NULL,
        [Username] nvarchar(64) NULL,
        [Fullname] nvarchar(200) NULL,
        [Action] nvarchar(100) NULL,
        [Module] nvarchar(100) NULL,
        [Target] nvarchar(500) NULL,
        [Ip] nvarchar(64) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [BoqItems] (
        [Id] nvarchar(64) NOT NULL,
        [ContractId] nvarchar(64) NULL,
        [Code] nvarchar(50) NULL,
        [Name] nvarchar(500) NOT NULL,
        [Unit] nvarchar(30) NULL,
        [Qty] float NULL,
        [Price] decimal(20,0) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_BoqItems] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [Catalogs] (
        [Id] nvarchar(64) NOT NULL,
        [Type] nvarchar(200) NOT NULL,
        [Value] nvarchar(300) NOT NULL,
        [Order] int NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_Catalogs] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [ConstructionDiaries] (
        [Id] nvarchar(64) NOT NULL,
        [ProjectId] nvarchar(64) NULL,
        [PackageId] nvarchar(64) NULL,
        [Date] date NULL,
        [Shift] nvarchar(50) NULL,
        [Weather] nvarchar(50) NULL,
        [Workers] int NULL,
        [Machines] nvarchar(max) NULL,
        [Works] nvarchar(max) NULL,
        [Issues] nvarchar(max) NULL,
        [Supervisor] nvarchar(200) NULL,
        [ByName] nvarchar(200) NULL,
        [Photos] nvarchar(max) NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_ConstructionDiaries] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [ConstructionItems] (
        [Id] nvarchar(64) NOT NULL,
        [ProjectId] nvarchar(64) NULL,
        [Code] nvarchar(50) NOT NULL,
        [Name] nvarchar(300) NOT NULL,
        [Structure] nvarchar(300) NULL,
        [Area] float NULL,
        [Floors] int NULL,
        [Progress] float NULL,
        [Desc] nvarchar(max) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_ConstructionItems] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [ContractAddenda] (
        [Id] nvarchar(64) NOT NULL,
        [ContractId] nvarchar(64) NULL,
        [Number] nvarchar(100) NULL,
        [Date] date NULL,
        [Content] nvarchar(max) NULL,
        [ValueChange] decimal(20,0) NULL,
        [DaysChange] int NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_ContractAddenda] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [Contracts] (
        [Id] nvarchar(64) NOT NULL,
        [PackageId] nvarchar(64) NULL,
        [ProjectId] nvarchar(64) NULL,
        [Number] nvarchar(100) NOT NULL,
        [Contractor] nvarchar(300) NULL,
        [SignDate] date NULL,
        [Value] decimal(20,0) NULL,
        [Start] date NULL,
        [End] date NULL,
        [Ctype] nvarchar(100) NULL,
        [Guarantee] nvarchar(100) NULL,
        [AdvanceRate] float NULL,
        [Note] nvarchar(max) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_Contracts] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [LegalDocuments] (
        [Id] nvarchar(64) NOT NULL,
        [ProjectId] nvarchar(64) NULL,
        [PackageId] nvarchar(64) NULL,
        [Type] nvarchar(200) NULL,
        [Number] nvarchar(200) NULL,
        [Date] date NULL,
        [Issuer] nvarchar(300) NULL,
        [Title] nvarchar(max) NULL,
        [FileName] nvarchar(300) NULL,
        [FileSize] bigint NULL,
        [AssetId] nvarchar(64) NULL,
        [Url] nvarchar(300) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_LegalDocuments] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [ModelFiles] (
        [Id] nvarchar(64) NOT NULL,
        [FileKey] nvarchar(64) NULL,
        [ProjectId] nvarchar(64) NULL,
        [ItemId] nvarchar(64) NULL,
        [Name] nvarchar(300) NOT NULL,
        [Format] nvarchar(20) NULL,
        [Version] int NOT NULL,
        [Date] date NULL,
        [By] nvarchar(200) NULL,
        [Size] bigint NULL,
        [Note] nvarchar(max) NULL,
        [AssetId] nvarchar(64) NULL,
        [Url] nvarchar(300) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_ModelFiles] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [Packages] (
        [Id] nvarchar(64) NOT NULL,
        [ProjectId] nvarchar(64) NULL,
        [Code] nvarchar(50) NOT NULL,
        [Name] nvarchar(500) NOT NULL,
        [Type] nvarchar(100) NULL,
        [Method] nvarchar(100) NULL,
        [Estimate] decimal(20,0) NULL,
        [Status] nvarchar(100) NULL,
        [Duration] nvarchar(200) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_Packages] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [PaymentPlans] (
        [Id] nvarchar(64) NOT NULL,
        [ContractId] nvarchar(64) NULL,
        [Phase] nvarchar(100) NULL,
        [PlanDate] date NULL,
        [Amount] decimal(20,0) NULL,
        [Note] nvarchar(max) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_PaymentPlans] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [Payments] (
        [Id] nvarchar(64) NOT NULL,
        [ContractId] nvarchar(64) NULL,
        [Number] nvarchar(100) NULL,
        [Date] date NULL,
        [Kind] nvarchar(100) NULL,
        [Amount] decimal(20,0) NULL,
        [Status] nvarchar(50) NULL,
        [Content] nvarchar(max) NULL,
        [PaidDate] date NULL,
        [FileName] nvarchar(300) NULL,
        [FileSize] bigint NULL,
        [AssetId] nvarchar(64) NULL,
        [Url] nvarchar(300) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_Payments] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [Projects] (
        [Id] nvarchar(64) NOT NULL,
        [Code] nvarchar(50) NOT NULL,
        [Name] nvarchar(500) NOT NULL,
        [Group] nvarchar(100) NULL,
        [Tmdt] decimal(20,0) NULL,
        [Capital] nvarchar(200) NULL,
        [Owner] nvarchar(300) NULL,
        [Location] nvarchar(300) NULL,
        [Start] date NULL,
        [End] date NULL,
        [Status] nvarchar(100) NULL,
        [Phase] nvarchar(100) NULL,
        [Decision] nvarchar(500) NULL,
        [Desc] nvarchar(max) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_Projects] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [ProjectTasks] (
        [Id] nvarchar(64) NOT NULL,
        [ProjectId] nvarchar(64) NULL,
        [Name] nvarchar(500) NOT NULL,
        [Assignee] nvarchar(200) NULL,
        [Due] date NULL,
        [Status] nvarchar(50) NULL,
        [Priority] nvarchar(50) NULL,
        [Note] nvarchar(max) NULL,
        [DoneDate] date NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_ProjectTasks] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [ScheduleItems] (
        [Id] nvarchar(64) NOT NULL,
        [ProjectId] nvarchar(64) NULL,
        [PackageId] nvarchar(64) NULL,
        [ItemId] nvarchar(64) NULL,
        [Name] nvarchar(500) NOT NULL,
        [PlanStart] date NULL,
        [PlanEnd] date NULL,
        [ActualStart] date NULL,
        [ActualEnd] date NULL,
        [Progress] float NULL,
        [Weight] float NULL,
        [History] nvarchar(max) NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_ScheduleItems] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [StoredFiles] (
        [Id] nvarchar(64) NOT NULL,
        [FileName] nvarchar(300) NOT NULL,
        [ContentType] nvarchar(200) NOT NULL,
        [Size] bigint NOT NULL,
        [RelPath] nvarchar(300) NOT NULL,
        [UploadedBy] nvarchar(64) NULL,
        [UploadedAt] datetime2 NOT NULL,
        CONSTRAINT [PK_StoredFiles] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [UserGroups] (
        [Id] nvarchar(64) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Desc] nvarchar(max) NULL,
        [Admin] bit NOT NULL,
        [Perms] nvarchar(max) NOT NULL,
        [Scope] nvarchar(max) NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_UserGroups] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] nvarchar(64) NOT NULL,
        [Username] nvarchar(64) NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Unit] nvarchar(200) NULL,
        [GroupId] nvarchar(64) NULL,
        [Email] nvarchar(200) NULL,
        [Phone] nvarchar(50) NULL,
        [Active] bit NOT NULL,
        [Sample] bit NOT NULL,
        [PasswordHash] nvarchar(max) NOT NULL,
        [FailedCount] int NOT NULL,
        [LockoutUntil] datetime2 NULL,
        [CreatedAt] datetime2 NULL,
        [LastLogin] datetime2 NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE TABLE [VolumeEntries] (
        [Id] nvarchar(64) NOT NULL,
        [BoqId] nvarchar(64) NULL,
        [ContractId] nvarchar(64) NULL,
        [Date] date NULL,
        [Period] nvarchar(100) NULL,
        [DoneQty] float NULL,
        [AcceptedQty] float NULL,
        [Note] nvarchar(max) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_VolumeEntries] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_AuditLogs_Ts] ON [AuditLogs] ([Ts]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_BoqItems_ContractId] ON [BoqItems] ([ContractId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Catalogs_Type] ON [Catalogs] ([Type]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ConstructionDiaries_PackageId_Date] ON [ConstructionDiaries] ([PackageId], [Date]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Contracts_PackageId] ON [Contracts] ([PackageId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Packages_ProjectId] ON [Packages] ([ProjectId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Payments_ContractId] ON [Payments] ([ContractId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Projects_Code] ON [Projects] ([Code]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_ScheduleItems_PackageId] ON [ScheduleItems] ([PackageId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_VolumeEntries_BoqId] ON [VolumeEntries] ([BoqId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027054159_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261027054159_InitialCreate', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027112331_TwoFactor'
)
BEGIN
    ALTER TABLE [Users] ADD [RecoveryCodes] nvarchar(1000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027112331_TwoFactor'
)
BEGIN
    ALTER TABLE [Users] ADD [TotpLastStep] bigint NOT NULL DEFAULT CAST(0 AS bigint);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027112331_TwoFactor'
)
BEGIN
    ALTER TABLE [Users] ADD [TotpSecret] nvarchar(1000) NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261027112331_TwoFactor'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261027112331_TwoFactor', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101021414_AttachmentsAndValidity'
)
BEGIN
    ALTER TABLE [LegalDocuments] ADD [ValidUntil] date NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101021414_AttachmentsAndValidity'
)
BEGIN
    ALTER TABLE [Contracts] ADD [AdvanceGuaranteeUntil] date NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101021414_AttachmentsAndValidity'
)
BEGIN
    ALTER TABLE [Contracts] ADD [GuaranteeUntil] date NULL;
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101021414_AttachmentsAndValidity'
)
BEGIN
    CREATE TABLE [Attachments] (
        [Id] nvarchar(64) NOT NULL,
        [Collection] nvarchar(40) NOT NULL,
        [RecordId] nvarchar(64) NOT NULL,
        [ProjectId] nvarchar(64) NULL,
        [Kind] nvarchar(200) NULL,
        [Ref] nvarchar(100) NULL,
        [FileId] nvarchar(64) NOT NULL,
        [FileName] nvarchar(300) NOT NULL,
        [ContentType] nvarchar(200) NOT NULL,
        [Size] bigint NOT NULL,
        [UploadedBy] nvarchar(200) NULL,
        [UploadedAt] datetime2 NOT NULL,
        [DeletedAt] datetime2 NULL,
        [DeletedBy] nvarchar(200) NULL,
        CONSTRAINT [PK_Attachments] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101021414_AttachmentsAndValidity'
)
BEGIN
    CREATE INDEX [IX_Attachments_Collection_RecordId] ON [Attachments] ([Collection], [RecordId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101021414_AttachmentsAndValidity'
)
BEGIN
    CREATE INDEX [IX_Attachments_FileId] ON [Attachments] ([FileId]);
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101021414_AttachmentsAndValidity'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261101021414_AttachmentsAndValidity', N'8.0.11');
END;
GO

COMMIT;
GO

BEGIN TRANSACTION;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101032652_GuidesAndBranding'
)
BEGIN
    CREATE TABLE [Guides] (
        [Id] nvarchar(64) NOT NULL,
        [Title] nvarchar(300) NOT NULL,
        [Category] nvarchar(200) NULL,
        [Content] nvarchar(max) NULL,
        [Groups] nvarchar(max) NOT NULL,
        [Order] int NOT NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_Guides] PRIMARY KEY ([Id])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101032652_GuidesAndBranding'
)
BEGIN
    CREATE TABLE [Settings] (
        [Key] nvarchar(64) NOT NULL,
        [Value] nvarchar(max) NULL,
        [UpdatedAt] datetime2 NULL,
        [UpdatedBy] nvarchar(64) NULL,
        CONSTRAINT [PK_Settings] PRIMARY KEY ([Key])
    );
END;
GO

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101032652_GuidesAndBranding'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261101032652_GuidesAndBranding', N'8.0.11');
END;
GO

COMMIT;
GO

