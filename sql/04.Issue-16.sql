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
			WHEN NumberOfSides = 5 THEN 'Square' 
			WHEN NumberOfSides > 20 THEN 'Circle' 
			ELSE 'Freeform' 
		END AS Shape,
		RealmName
	FROM dbo.Plot
	WHERE DiscordServerId = @DiscordServerId
        AND RealmName = @RealmName
END
GO
