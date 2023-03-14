
CREATE TABLE   `users` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `email` VARCHAR(64) NOT NULL UNIQUE, `password` VARCHAR(255) NOT NULL, `firstname` VARCHAR(64) NOT NULL, `lastname` VARCHAR(64) NOT NULL, `dob` VARCHAR(255) NOT NULL, `avatar` VARCHAR(255), `nickname` VARCHAR(64), `aboutme` VARCHAR(255), `followers` INTEGER DEFAULT 0, `following` INTEGER DEFAULT 0, 'status' TEXT);
INSERT INTO  users VALUES(1,'ed@f.com','$2a$10$RxwoMbYY8sQPFAjXNXkHM.y7CYouOsqi4CrOEkGZO8ORVJAlYAeAS','ed','Amaya','1999-03-09','','ed','lol',0,0,'public');
CREATE TABLE   `sessions` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `sessionUUID` VARCHAR(255) NOT NULL UNIQUE, `userID` VARCHAR(64) NOT NULL UNIQUE, `email` VARCHAR(255) NOT NULL UNIQUE);
INSERT INTO  sessions VALUES(1,'589f33fd-95bc-41d5-bff3-7bd2a40bf7b5','1','ed@f.com');
CREATE TABLE   `chatroom` (`id` TEXT NOT NULL, `name` TEXT, `description` TEXT, `type` TEXT NOT NULL, `users` VARCHAR(255) NOT NULL,`admin` TEXT NOT NULL, avatar TEXT);
CREATE TABLE   `messages` ( `id` TEXT NOT NULL, `sender` VARCHAR(255) NOT NULL, `messageId` TEXT NOT NULL UNIQUE, `message` TEXT COLLATE NOCASE, `date` NUMBER);
CREATE TABLE   `posts` ( `id` TEXT NOT NULL UNIQUE, `author` TEXT NOT NULL, `image` TEXT,`text` TEXT,`thread` TEXT, `time` NUMBER);
INSERT INTO  posts VALUES('61393539323362362d373766372d346138622d396261352d633061343932646562356164','ed','','check','',1678227631929);
CREATE TABLE   `likes` (`id` TEXT NOT NULL, `username` TEXT NOT NULL, `like` TEXT);
CREATE TABLE   `comments` (`id` TEXT NOT NULL UNIQUE, `postid` TEXT NOT NULL, `author` TEXT NOT NULL, `image` TEXT, `text` TEXT, `thread` TEXT, `time` NUMBER);
CREATE TABLE   `likescom` (`id` TEXT NOT NULL, `username` TEXT NOT NULL, `like` TEXT);
CREATE TABLE   `followers` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `follower` VARCHAR(64), `followee` VARCHAR(64));
CREATE TABLE   `chatNotification` (`sender` TEXT NOT NULL, `receiver` TEXT NOT NULL, `chatId` TEXT NOT NULL, `numOfMessages` NUMBER, `date` NUMBER);
CREATE TABLE   `requestNotification` (`sender` TEXT NOT NULL, `receiver` TEXT NOT NULL, `typeOfRequest` TEXT NOT NULL, `groupId` TEXT);
CREATE TABLE   `groups` (`id` TEXT NOT NULL, `name` TEXT, `description` TEXT, `users` VARCHAR(255) NOT NULL,`admin` TEXT NOT NULL, avatar TEXT);
CREATE TABLE   `groupposts` ( `id` TEXT, `postid` TEXT NOT NULL UNIQUE, `author` TEXT NOT NULL, `image` TEXT,`text` TEXT,`thread` TEXT, `time` NUMBER);
CREATE TABLE   `likesgroup` (`id` TEXT NOT NULL, `username` TEXT NOT NULL, `like` TEXT);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('users',1);
INSERT INTO sqlite_sequence VALUES('sessions',1);

