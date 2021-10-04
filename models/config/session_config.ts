type SessionConfig = {
  resave: boolean,
  saveUninitialized: boolean,
  name: string,
  cookie: { maxAge: number },
  secret : string,
  store? : any
}

export {
  SessionConfig
}
