CREATE TABLE applications
(
  id serial primary key,
  name varchar(128) not null,
  email varchar(256) not null,
  phone int not null,
  text text,
  job varchar(32) not null,
  processed boolean default false,
  created timestamp
  with time zone not null default current_timestamp,
  updated timestamp
  with time zone not null default current_timestamp
);

  CREATE TABLE users
  (
    name varchar(64) not null
    /* todo skema */
  );
