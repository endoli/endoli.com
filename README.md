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
- create posts according to example below
- add any binary assets to `assets` directory
- `npm run publish` to build everything

## Considerations

- JavaScript is linted through eslint according to AirBnB style
- JavaScript code-completion is enabled through Tern
- additional code style is in accordance to EditorConfig

## Limitations
- repository tags that are unable to have docs built are retried each time
- `master` is rebuilt each time, irrelevant of were there any changes meanwhile

## Example

This is a valid example blog post:

```
---
title: Example
author: John Doe
published: false
date: 2015-12-31
categories:
  - One
  - Two
tags:
  - two
  - three
  - four
---

# Example Blog Post

Lorem ipsum dolor sit amet.

## Example Blog Post Subtitle

Proin ultricies eget dolor id condimentum. Proin viverra sollicitudin tellus
posuere accumsan. Ut tincidunt sapien et turpis vulputate, at facilisis nisl
euismod. Nam sed tortor vel quam porta efficitur in nec nunc. Fusce ligula est.

};
```

