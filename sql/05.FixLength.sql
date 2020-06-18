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
			WHEN p.NumberOfSides > 20 THEN 'Circle' 
			ELSE 'Freeform' 
		END AS Shape
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
		'Square' AS Shape
	FROM dbo.Plot p
		JOIN #SearchResults sr ON sr.Id = p.Id
    WHERE NumberOfSides = 5    
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
		RealmName
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
		RealmName
	FROM dbo.Plot
	WHERE DiscordServerId = @DiscordServerId
        AND RealmName = @RealmName
        AND NumberOfSides = 5
END
