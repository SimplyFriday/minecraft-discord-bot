CREATE OR ALTER PROCEDURE dbo.InsertAppLog
    @LogTime DATETIME = NULL,
    @Message NVARCHAR(200),
    @StackTrace VARCHAR(MAX)
AS
BEGIN
    SET @LogTime = ISNULL(@LogTime, GETUTCDATE());

    INSERT INTO dbo.AppLog
    (
        LogTime,
        Message,
        StackTrace
    )
    VALUES
    (   
		@LogTime, 
		@Message, 
		@StackTrace
	);
END;
GO

CREATE OR ALTER FUNCTION GetSquareArea
(
	@CenterX BIGINT,
	@CenterY BIGINT,
	@SideLength INT
) 
RETURNS GEOMETRY
AS
BEGIN 
	DECLARE
		@corner1 VARCHAR(50) = CONVERT(VARCHAR(10),@CenterX - @SideLength) + ' ' + CONVERT(VARCHAR(10),@CenterY - @SideLength),
		@corner2 VARCHAR(50) = CONVERT(VARCHAR(10),@CenterX - @SideLength) + ' ' + CONVERT(VARCHAR(10),@CenterY + @SideLength),
		@corner3 VARCHAR(50) = CONVERT(VARCHAR(10),@CenterX + @SideLength) + ' ' + CONVERT(VARCHAR(10),@CenterY + @SideLength),
		@corner4 VARCHAR(50) = CONVERT(VARCHAR(10),@CenterX + @SideLength) + ' ' + CONVERT(VARCHAR(10),@CenterY - @SideLength)

	RETURN geometry::STGeomFromText
		(
			'POLYGON((' + @corner1 + ',' + @corner2 + ',' + @corner3 + ',' + @corner4 + ',' + @corner1 +  '))'
		, 0);
END
GO

CREATE OR ALTER FUNCTION GetCircleArea
(
	@CenterX BIGINT,
	@CenterY BIGINT,
	@Radius INT
) 
RETURNS GEOMETRY
AS
BEGIN 
	DECLARE @circle GEOMETRY;	
	SET @circle = geometry::STGeomFromText('POINT(' + CONVERT(VARCHAR(20),@CenterX) + ' ' + CONVERT(VARCHAR(20),@CenterY) + ')', 0);

	RETURN @circle.BufferWithTolerance(@Radius, .025, 0)
END
GO

CREATE OR ALTER PROCEDURE dbo.InsertSquarePlot
(
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@Notes NVARCHAR(500) = NULL,
	@OwnerId VARCHAR(40),

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
		OwnerId
	)
	VALUES
	(   
		@DiscordServerId,
	    @CenterX,
		@CenterY,
	    @Area,
	    @RealmName, 
	    @Notes,
		@OwnerId
	)
END
GO

CREATE OR ALTER PROCEDURE dbo.InsertFreeFormPlot
(
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@Notes NVARCHAR(500) = NULL,
	@OwnerId VARCHAR(40),

	@points VARCHAR(900)

)
AS
BEGIN

	DECLARE @area GEOMETRY = 'POLYGON((' + @points +  '))'
	DECLARE @centeroid GEOMETRY = @Area.STCentroid();

	INSERT INTO dbo.Plot
	(
	    DiscordServerId,
	    CenterX,
		CenterY,
	    Area,
	    RealmName,
	    Notes,
		OwnerId
	)
	VALUES
	(   
		@DiscordServerId,
	    CAST(@centeroid.STX AS INT),
		CAST(@centeroid.STY AS INT),
	    @area,
	    @RealmName, 
	    @Notes,
		@OwnerId
	)
END
GO

CREATE OR ALTER PROCEDURE dbo.InsertCirclePlot
(
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@Notes NVARCHAR(500) = NULL,
	@OwnerId VARCHAR(40),

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
		OwnerId
	)
	VALUES
	(   
		@DiscordServerId,
	    @CenterX,
		@CenterY,
	    @Area,
	    @RealmName, 
	    @Notes,
		@OwnerId
	)
END
GO

CREATE OR ALTER PROCEDURE dbo.CheckForPlotIntersect
(
	@GeoToCheck GEOMETRY,
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100)
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

	RETURN @@ROWCOUNT
END
GO

CREATE OR ALTER PROCEDURE dbo.GetUserPlot
(
	@UserId VARCHAR(40),
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100)
)
AS
BEGIN
	SELECT CenterX,
           CenterY,
           Notes	
	FROM dbo.Plot
	WHERE RealmName = @RealmName
		AND DiscordServerId = @DiscordServerId
		AND OwnerId = @UserId
END
GO

CREATE OR ALTER PROCEDURE dbo.GetRealmSettings
(
	@DiscordServerId VARCHAR(40)
)
AS
BEGIN
	SELECT [Key],
            Value,
			RealmName,
			PlayerId
	FROM dbo.RealmSetting
	WHERE @DiscordServerId = DiscordServerId
END
GO

CREATE OR ALTER PROCEDURE dbo.SetRealmSetting
(
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@Key VARCHAR(50),
	@Value NVARCHAR(500),
	@PlayerId VARCHAR(40) = NULL
)
AS
BEGIN
	IF @PlayerId IS NOT NULL
		MERGE INTO dbo.RealmSetting WITH (HOLDLOCK) AS dst
		USING
		(
			SELECT @Key AS [Key]
		) AS src
			ON dst.[Key] = src.[Key]
			AND dst.DiscordServerId = @DiscordServerId
			AND dst.RealmName = @RealmName
			AND  dst.PlayerId = @PlayerId
		WHEN MATCHED THEN 
			UPDATE SET dst.Value = @Value
		WHEN NOT MATCHED THEN
			INSERT
			(
				[Key],
				Value,
				DiscordServerId,
				RealmName,
				PlayerId
			)
			VALUES
			(
				@Key,
				@Value,
				@DiscordServerId,
				@RealmName,
				@PlayerId
			);
	ELSE
		MERGE INTO dbo.RealmSetting WITH (HOLDLOCK) AS dst
		USING
		(
			SELECT @Key AS [Key]
		) AS src
			ON dst.[Key] = src.[Key]
			AND dst.DiscordServerId = @DiscordServerId
			AND dst.RealmName = @RealmName
			AND dst.PlayerId IS NULL
		WHEN MATCHED THEN 
			UPDATE SET dst.Value = @Value
		WHEN NOT MATCHED THEN
			INSERT
			(
				[Key],
				Value,
				DiscordServerId,
				RealmName,
				PlayerId
			)
			VALUES
			(
				@Key,
				@Value,
				@DiscordServerId,
				@RealmName,
				@PlayerId
			);
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
		CASE WHEN NumberOfSides > 20 THEN 'Circle' ELSE	'Freeform' END AS Shape
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
		'Sqaure' AS Shape
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
	@RealmName NVARCHAR(100)
)
AS
BEGIN
	DECLARE @geo GEOMETRY;
	SET @geo = dbo.GetSquareArea(@CenterX, @CenterY, @Size);

	EXEC dbo.CheckForPlotIntersect @GeoToCheck = @geo,
	                               @DiscordServerId = @DiscordServerId,
	                               @RealmName = @RealmName
	
END
GO

CREATE OR ALTER PROCEDURE dbo.CheckForCirclePlotIntersect
(
	@Size INT,
	@CenterX BIGINT,
	@CenterY BIGINT,
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100)
)
AS
BEGIN
	DECLARE @geo GEOMETRY;
	SET @geo = dbo.GetCircleArea(@CenterX, @CenterY, @Size);

	EXEC dbo.CheckForPlotIntersect @GeoToCheck = @geo,
	                               @DiscordServerId = @DiscordServerId,
	                               @RealmName = @RealmName
	
END
GO

CREATE OR ALTER PROCEDURE dbo.GetPlotsByRealmAndCoordinates
(
	@DiscordServerId VARCHAR(40),
	@RealmName NVARCHAR(100),
	@XCoordinate BIGINT,
	@YCoordinate BIGINT,
	@Radius INT
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

	SELECT 
		p.Id,
		p.CenterX,
		p.CenterY,
		p.Notes,
		p.OwnerId,
		ROUND(p.Area.STPointN(1).STDistance(p.Area.STCentroid()),0) AS Length,
		CASE  
			WHEN p.NumberOfSides = 5 THEN 'Square' 
			WHEN p.NumberOfSides > 20 THEN 'Circle' 
			ELSE 'Freeform' 
		END AS Shape
	FROM dbo.Plot p
		JOIN #SearchResults sr ON sr.Id = p.Id
END
GO


