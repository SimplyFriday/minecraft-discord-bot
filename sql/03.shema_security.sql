CREATE ROLE AppUser;
GO

GRANT EXECUTE ON SCHEMA::dbo TO AppUser;
GO

---- Sample login
--CREATE USER Mcb FOR LOGIN McbUser;
--GO

--ALTER ROLE AppUser ADD MEMBER Mcb;
--GO