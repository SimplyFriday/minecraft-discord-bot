SET XACT_ABORT ON;
BEGIN TRANSACTION;

ALTER TABLE dbo.Plot SET (SYSTEM_VERSIONING = OFF);

ALTER TABLE dbo.Plot
	ADD Dimension VARCHAR(30) 
	CONSTRAINT dDimension DEFAULT 'Overworld' NULL;

ALTER TABLE dbo.PlotHistory
	ADD Dimension VARCHAR(30)
	CONSTRAINT dDimensionHist DEFAULT 'Overworld' NULL;
GO

UPDATE dbo.Plot 
SET Dimension = DEFAULT 
WHERE Dimension IS NULL;

UPDATE dbo.PlotHistory
SET Dimension = DEFAULT 
WHERE Dimension IS NULL;

ALTER TABLE dbo.Plot
	ALTER COLUMN Dimension VARCHAR(30) NOT NULL;

ALTER TABLE dbo.PlotHistory
	ALTER COLUMN Dimension VARCHAR(30) NOT NULL;

ALTER TABLE dbo.Plot
    SET
         (
            SYSTEM_VERSIONING = ON
           ( HISTORY_TABLE = dbo.PlotHistory)
         );
COMMIT;
GO

CREATE OR ALTER PROCEDURE dbo.InsertSquarePlot
(
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@Notes NVARCHAR(500) = NULL,
	@OwnerId VARCHAR(40),
    @Dimension VARCHAR(30),

	@CenterX BIGINT,
	@CenterY BIGINT,
	@SideLength INT

)
AS
BEGIN

	DECLARE @Area GEOMETRY = dbo.GetSquareArea(@CenterX, @CenterY, @SideLength);

	INSERT INTO dbo.Plot
	(
	    DiscordServerId,
	    CenterX,
		CenterY,
	    Area,
	    RealmName,
	    Notes,
		OwnerId,
		Dimension
	)
	VALUES
	(   
		@DiscordServerId,
	    @CenterX,
		@CenterY,
	    @Area,
	    @RealmName, 
	    @Notes,
		@OwnerId,
		@Dimension
	)
END
GO

CREATE OR ALTER PROCEDURE dbo.InsertCirclePlot
(
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@Notes NVARCHAR(500) = NULL,
	@OwnerId VARCHAR(40),
    @Dimension VARCHAR(30),

	@CenterX BIGINT,
	@CenterY BIGINT,
	@Radius INT

)
AS
BEGIN

	DECLARE @Area GEOMETRY = dbo.GetCircleArea(@CenterX, @CenterY, @Radius);

	INSERT INTO dbo.Plot
	(
	    DiscordServerId,
	    CenterX,
		CenterY,
	    Area,
	    RealmName,
	    Notes,
		OwnerId,
		Dimension
	)
	VALUES
	(   
		@DiscordServerId,
	    @CenterX,
		@CenterY,
	    @Area,
	    @RealmName, 
	    @Notes,
		@OwnerId,
		@Dimension
	)
END
GO

CREATE OR ALTER PROCEDURE dbo.CheckForPlotIntersect
(
	@GeoToCheck GEOMETRY,
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
    @Dimension VARCHAR(30)
)
AS
BEGIN
	SELECT 
		OwnerId, 
		Notes, 
		LTRIM(STR(Area.STIntersection(@GeoToCheck).STCentroid().STX, 25, 2)) AS OverlapCenterX,
		LTRIM(STR(Area.STIntersection(@GeoToCheck).STCentroid().STY, 25, 2)) AS OverlapCenterY,
		LTRIM(STR(Area.STIntersection(@GeoToCheck).STArea(), 25, 2)) AS OverlapArea
	FROM dbo.Plot
	WHERE Area.STIntersection(@GeoToCheck).STIsEmpty() = 0 -- Yeah, this is bad... but there's a covering index on DiscordServerId and RealmName which includes Area
		AND DiscordServerId = @DiscordServerId
		AND RealmName = @RealmName
		AND Dimension = @Dimension

	RETURN @@ROWCOUNT
END
GO

CREATE OR ALTER PROCEDURE dbo.GetPlotsByOwnerAndRealm
(
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@OwnerId NVARCHAR(100)
)
AS
BEGIN
	SELECT 
		Id,
		CenterX,
		CenterY,
		ROUND(Area.STPointN(1).STDistance(Area.STCentroid()),0) AS Length,
		Notes,
		CASE WHEN NumberOfSides > 20 THEN 'Circle' ELSE	'Freeform' END AS Shape,
		Dimension
	FROM dbo.Plot
	WHERE NumberOfSides <> 5
		AND DiscordServerId = @DiscordServerId
		AND RealmName = @RealmName
		AND OwnerId = @OwnerId
	UNION
	SELECT 
		Id,
		CenterX,
		CenterY,
		ROUND(geometry::STPointFromText('POINT(' + CONVERT(VARCHAR(20),CenterX) + ' ' + CONVERT(VARCHAR(20),Area.STPointN(1).STY ) + ')', 0).STDistance(Area.STCentroid()),0) AS Length,
		Notes,
		'Square' AS Shape,
		Dimension
	FROM dbo.Plot
	WHERE NumberOfSides = 5
		AND DiscordServerId = @DiscordServerId
		AND RealmName = @RealmName
		AND OwnerId = @OwnerId
	ORDER BY Id
END
GO

CREATE OR ALTER PROCEDURE dbo.CheckForSquarePlotIntersect
(
	@Size INT,
	@CenterX BIGINT,
	@CenterY BIGINT,
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@Dimension VARCHAR(30)
)
AS
BEGIN
	DECLARE @geo GEOMETRY;
	SET @geo = dbo.GetSquareArea(@CenterX, @CenterY, @Size);

	EXEC dbo.CheckForPlotIntersect @GeoToCheck = @geo,
	                               @DiscordServerId = @DiscordServerId,
	                               @RealmName = @RealmName,
								   @Dimension = @Dimension
	
END
GO

CREATE OR ALTER PROCEDURE dbo.CheckForCirclePlotIntersect
(
	@Size INT,
	@CenterX BIGINT,
	@CenterY BIGINT,
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@Dimension VARCHAR(30)
)
AS
BEGIN
	DECLARE @geo GEOMETRY;
	SET @geo = dbo.GetCircleArea(@CenterX, @CenterY, @Size);

	EXEC dbo.CheckForPlotIntersect @GeoToCheck = @geo,
	                               @DiscordServerId = @DiscordServerId,
	                               @RealmName = @RealmName,
								   @Dimension = @Dimension
	
END
GO
CREATE OR ALTER PROCEDURE dbo.GetPlotsByRealmAndCoordinates
(
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@XCoordinate BIGINT,
	@YCoordinate BIGINT,
	@Radius INT,
	@Dimension VARCHAR(30)
)
AS
BEGIN
	DECLARE @area GEOMETRY;
	SET @area = dbo.GetCircleArea(@XCoordinate,@YCoordinate, @Radius);

	CREATE TABLE #SearchResults
	(
	    Id INT PRIMARY KEY CLUSTERED
	);

	INSERT INTO #SearchResults
	(
	    Id
	)

	SELECT Id
	FROM dbo.Plot
	WHERE DiscordServerId = @DiscordServerId
		AND RealmName = @RealmName
		AND Area.STIntersection(@area).STIsEmpty() = 0
		AND Dimension = @Dimension

	SELECT 
		p.Id,
		p.CenterX,
		p.CenterY,
		p.Notes,
		p.OwnerId,
		ROUND(p.Area.STPointN(1).STDistance(p.Area.STCentroid()),0) AS Length,
		CASE  
			WHEN p.NumberOfSides > 20 THEN 'Circle' 
			ELSE 'Freeform' 
		END AS Shape,
		Dimension
	FROM dbo.Plot p
		JOIN #SearchResults sr ON sr.Id = p.Id
    WHERE NumberOfSides <> 5
    UNION
    SELECT 
		p.Id,
		p.CenterX,
		p.CenterY,
		p.Notes,
		p.OwnerId,
		ROUND(geometry::STPointFromText('POINT(' + CONVERT(VARCHAR(20),CenterX) + ' ' + CONVERT(VARCHAR(20),Area.STPointN(1).STY ) + ')', 0).STDistance(Area.STCentroid()),0) AS Length,
		'Square' AS Shape,
		Dimension
	FROM dbo.Plot p
		JOIN #SearchResults sr ON sr.Id = p.Id
    WHERE NumberOfSides = 5    
END
GO

CREATE OR ALTER PROCEDURE dbo.GetPlotById
(
	@PlotId INT
)
AS
BEGIN
	SELECT 
		Id,
		CenterX,
		CenterY,
		Notes,
		OwnerId,
		ROUND(Area.STPointN(1).STDistance(Area.STCentroid()),0) AS Length,
		CASE  
			WHEN NumberOfSides > 20 THEN 'Circle' 
			ELSE 'Freeform' 
		END AS Shape,
		RealmName,
		DiscordServerId,
		Dimension
	FROM dbo.Plot
	WHERE Id = @PlotId
		AND NumberOfSides <> 5
	UNION
		SELECT 
		Id,
		CenterX,
		CenterY,
		Notes,
		OwnerId,
		ROUND(geometry::STPointFromText('POINT(' + CONVERT(VARCHAR(20),CenterX) + ' ' + CONVERT(VARCHAR(20),Area.STPointN(1).STY ) + ')', 0).STDistance(Area.STCentroid()),0) AS Length,
		'Square' AS Shape,
		RealmName,
		DiscordServerId,
		Dimension
	FROM dbo.Plot
	WHERE Id = @PlotId
		AND NumberOfSides = 5
END
GO

CREATE OR ALTER PROCEDURE dbo.GetPlotsByRealm
(
	@DiscordServerId VARCHAR(40),
    @RealmName NVARCHAR(100)
)
AS
BEGIN
	SELECT 
		Id,
		CenterX,
		CenterY,
		Notes,
		OwnerId,
		ROUND(Area.STPointN(1).STDistance(Area.STCentroid()),0) AS Length,
		CASE  
			WHEN NumberOfSides > 20 THEN 'Circle' 
			ELSE 'Freeform' 
		END AS Shape,
		RealmName,
		Dimension
	FROM dbo.Plot
	WHERE DiscordServerId = @DiscordServerId
        AND RealmName = @RealmName
        AND NumberOfSides <> 5
    UNION
    SELECT 
		Id,
		CenterX,
		CenterY,
		Notes,
		OwnerId,
		ROUND(geometry::STPointFromText('POINT(' + CONVERT(VARCHAR(20),CenterX) + ' ' + CONVERT(VARCHAR(20),Area.STPointN(1).STY ) + ')', 0).STDistance(Area.STCentroid()),0) AS Length,
		'Square' AS Shape,
		RealmName,
		Dimension
	FROM dbo.Plot
	WHERE DiscordServerId = @DiscordServerId
        AND RealmName = @RealmName
        AND NumberOfSides = 5
END
