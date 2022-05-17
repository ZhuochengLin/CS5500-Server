# Express Server for CS5500 Project
## Client Repo:
https://github.com/ZhuochengLin/CS5500-Client
## API Endpoint
All endpoints that can create/update/delete data now need a logged-in user to use. A normal user can only manipulate 
data that belongs to him/her. An administrator can do anything.
### users
* GET ```/api/users``` Find all users
* GET ```/api/users/:uid``` Find user by id
* POST ```/api/users``` Create user
* PUT ```/api/users/:uid``` Update user
* DELETE ```/api/users/:uid``` Delete user
* DELETE ```/api/users``` Delete all users

### tuits
* GET ```/api/tuits``` Find all tuits
* GET ```/api/users/:uid/tuits``` Find all tuits by user
* GET ```/api/tuits/:tid``` Find tuit by id
* GET ```/api/users/:uid/tuits-with-media``` Find tuits with media by user ID
* POST ```/api/users/:uid/tuits``` Create tuit by user, media content should be sent as **multipart/form-data**
* PUT ```/api/users/:uid/tuits/:tid``` Update tuit
* DELETE ```/api/tuits/:tid``` Delete tuit by id
* DELETE ```/api/tuits``` Delete all tuits

### likes
* GET ```/api/likes``` Finf all likes
* GET ```/api/users/:uid/likes``` Find all tuits liked by user
* PUT ```/api/users/:uid/likes/:tid``` User toggles likes a tuit

