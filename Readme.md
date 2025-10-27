## Tubet API
Tubet is a Restful API providing access to sports betting odds in Kenya.

This currently only supports a few sites including. More will be added shortly:

- [Sportpesa](https://www.sportpesa.com)
- [Elitebet](http://www.elitebetkenya.com)
- [BetIn](https://betin.co.ke)
- [JustBet](http://justbet.co.ke)

We also only have data for the English premier league but will expand to more leagues on demand.

### Endpoints

#### 1. Sources
This tells you which sites data is currently available.

###### Url: /api/v1/sources

Results:

```
[{
  "id": 1,
  "name": "Sportpesa",
  "key": "sportpesa",
  "url": "https://www.sportpesa.com"
}]
```

#### 2. Leagues
This tells you which leagues we currently have data for.

##### Url: /api/v1/leagues
Results:

```
[
  {
    "id": 57d9a426b419f73d5072eb62,
    "key": "1",
    "code": "epl",
    "name": "English Premier League"
  }
]
```


#### 2. Teams
This tells you which teams are taking part in a given league. The data is public domain but drawn from
[here](https://github.com/openfootball/football.json)

##### Url: /api/v1/league/:key/teams

```
[
  {
    "key": "chelsea",
    "name": "Chelsea",
    "code": "CHE"
  }
  ...
]

```

#### 3. Fixtures
This endpoint tells you the games being played round by round. Some historical data is present (i.e. the results) but should not be relied upon to be 100% accurate for now.

##### Url: /api/v1/league/:id/fixtures

```
{
  "rounds": [
    {
      "name": "Matchday 1",
      "matches": [
        {
          "date": "2016-08-13",
          "team1": {
            "key": "hull",
            "name": "Hull City",
            "code": "HUL"
          },
          "team2": {
            "key": "leicester",
            "name": "Leicester City",
            "code": "LEI"
          },
          "score1": 2,
          "score2": 1
        },
        ...
    }
    ....
    ]
  }
  ```

#### 4. Search
This endpoint provides a basic fuzzy search for team names. Useful for where someone does not provide a full team name.

##### URI: /api/v1/search/teams?term=west

```
[
  {
    "id": "57d9ae1783295e42bdc4a414",
    "key": "westham",
    "name": "West Ham United",
    "code": "WHU"
  },
  {
    "id": "57d9ae1783295e42bdc4a41a",
    "key": "westbrom",
    "name": "West Bromwich Albion",
    "code": "WBA"
  }
]  
```
