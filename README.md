# Endoli Web

## Requirements

- UNIX or Linux
- Node.js v6.x.x
- npm
- rust
- cargo

## Instructions

- `npm install -d` to install all the dependencies
- create end edit `config.json` according to `config.template.json`
- create posts according to `blog/example.md`
- `npm run publish` to build everything

## Considerations

- JavaScript is linted through eslint according to AirBnB style
- JavaScript code-completion is enabled through Tern
- additional code style is in accordance to EditorConfig

## Limitations
- repository tags that are unable to have docs built are retried each time
- `master` is rebuilt each time, irrelevant of were there any changes meanwhile
