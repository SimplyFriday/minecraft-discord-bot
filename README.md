# Plot Bot
A discord bot that helps admins and players track plot ownership in Minecraft.

# Install
To install the bot, [click here](https://discordapp.com/api/oauth2/authorize?client_id=631582135165124620&permissions=18432&scope=bot). Please note that the bot is still very much in a beta state! If you encounter any issues, please log them and I'll work on them as soon as I can. Please feel free to add feature requests as well!

## Configuration
To work correctly, server admins should configure this bot before letting players use it.
When it is first installed, the bot will not enforce any kind of role based security. This
is so that admins can configure it without adding extra roles. To start, simply type
"%settings" to view all of the defaults. You can change them with "%settings set \[key\] \[value\]"

At a minimum you need to set "serverIsConfigured" to true. This will lock down commands to
specific roles (e.g. "%settings set" will only work for admins). A few good items to configure 
include:
- serverAdminRoleName - This controls the role name that designates admins
- serverModeratorRoleName - Moderator role, it has less permissions than admins but more than players
- serverPlayerRoleName - This role is required to use any commands, unless the user is already a moderator or admin.
- defaultPlotShape - Either square or circle, determines the shape of plots.

### Overrides
This bot understands 3 tiers of configuration: Server, Realm, and Player. The settings command will always return 
the most generally applicable set, meaning that if nothing is specified it will return all server level settings,
plus realm settings for the defaultRealmName. If your Discord server contains multiple Realms, or has different config
for some players, you can override values.

**Configure Second Realm**

There's actually no setup required to use a second Realm, if that second Realm uses the same values as the primary. All
users have to do is specify a realm when looking up or claiming plots (see the "Viewing Plots" section below)!

If you want different settings for other Realms, however, you can override the primary values by specifying Realm name
in the "settings set" sub command.
```>%settings set defaultPlotShape Circle "Realm 2: Electric Boogaloo"```

Any claims that specify "Realm 2: Electric Boogaloo" as the realm name will now be a circle.

The same can be done for specific players. By using the "-p" flag, you can @mention a specific player (or manually type 
their player id).
```>%settings set maximumPlayerPlots 3 -p @userName```

This will allow @userName to claim up to 3 plots, instead of the default. **WARNING** This can be lower than the default,
which will lower the number of plots @userName can claim!

# Usage
Basic usage of the bot includes viewing current plots (2D areas of in game land) and claiming new ones.

## Viewing plots
Using the "%plot" command without any arguments will look up any plots owned by the current user on the default realm.

You can look up plots owned by someone else, either via @mentioning them or typing in the owner name.

```>%plot @userName```

You can also specify a Realm name, if your Discord server houses many Realms.

```>%plot @userName "My Cool Realm"```

If you want to look up *all* plots in a given area, use the "-c" flag and a comma separated list of values - "RadiusToSearch,XCoord,ZCoord":

```>%plot -c "500,0,0"```

This will find any plots that are within a 500 meter radius of 0,0.

## Claiming plots

You can claim plots using the "plot claim" sub command.

```>%plot claim 100 100```

This will do a few things:
1. First, it checks to see if you have already claimed the maximum number of plots, defined in the maximumPlayerPlots setting.
2. If you have less than the max, it then checks to see if the new plot would intersect any current plots on the Realm. It uses
the defaultPlotSizeMeters and defaultPlotShape settings to determine plot dimensions.
3. If the plot is clear, then it adds a new plot for the current user.

## Deleting Plots

You can delete a plot using the "plot delete" sub command. Deletes must be done using the plot Id, found using the base "plot" 
command. Plots may only be deleted from the server to which they belong.

```>%plot delete 65```

### Overrides

-n: This flag can be used by anyone when claiming a plot. This simply adds a "notes" section to the plot, which is returned when viewing.
-o: Moderator+ only, this flag allows you to claim a plot on behalf of another. You can either @mention the user, copy-paste their Discord Id,
or add a string identifier like "Server" (this still obeys plot overlap and max plot rules).
-s: Moderator+ only, you can specify the plot shape, either "square" or "circle"
-i: Moderator+ only, you can specify the plot radius in meters.

## Group Plots
Some Realms allow players to form groups, and those plots are tracked separately. To accomplish this, moderators and admins can use the -o
switch on "plot claim"
```>%plot claim 100, 100 -o "Super Adventuring Friends"```

And it can be looked up by anyone using:
```>%plot "Super Adventuring Friends"```
