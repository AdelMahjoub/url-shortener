# Url Shortener
## API usage
### Request

```
https://s-urls.herokuapp.com?[query string]
```

Where query string is in this format => ?url=[url you want to shorten]

The Url you want to shorten must contain the protocol.

#### Exemple:

https://s-urls.herokuapp.com/?url=https://google.com

### Response

If the query contains a valid url, you'll get a response in this format

```
{
 "url": "https://google.com",
 "short_url": "http://s-urls.herokuapp.com/rJtzcNRix"
}
    
```