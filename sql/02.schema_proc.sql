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
	@DiscordServerId BIGINT,
	@RealmName NVARCHAR(100),
	@Notes NVARCHAR(500) = NULL,
	@OwnerId BIGINT,

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
	@DiscordServerId BIGINT,
	@RealmName NVARCHAR(100),
	@Notes NVARCHAR(500) = NULL,
	@OwnerId BIGINT,

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
	@DiscordServerId BIGINT,
	@RealmName NVARCHAR(100),
	@Notes NVARCHAR(500) = NULL,
	@OwnerId BIGINT,

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
	@DiscordServerId BIGINT,
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
	@UserId BIGINT,
	@DiscordServerId BIGINT,
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
	@DiscordServerId BIGINT,
	@RealmName NVARCHAR(100) = NULL
)
AS
BEGIN
	SELECT [Key],
            Value
	FROM dbo.RealmSetting
	WHERE @DiscordServerId = DiscordServerId
		AND 
		(
			@RealmName IS NULL
			OR RealmName = @RealmName
		)
END
GO
