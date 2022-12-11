create new table called images with an id that auto incements, 
date timestamp (use same name), fileName (is nullable, string),
another column, postId which references the post that created it (foreign key)

insert dummy date into this table when you add a post /

and then print the id of the newly isnerted image 

check into git

Bring in the sample modules (run npm install) 
check if anything is broken

--------START HERE--------

get the original image uploading sample working first by changing all ports 
keep it always running
in the sample add a new field called textbox and recieve it and print it inside the server code
then take all of the code of the server and client from the sample, move the client code to my project

move the server code wholesale which means unaltered make sure the folder where the images are getting saved
is there and unaltered (same folder strucure on the server)

make sure this all works

merge the new function with the current one (that does the update), the only difference is that instead of 
file.name, you use imageId as the fileName... the resulting image names in the folder will be "1.png" "2.png"
make it support jpg and png 

mount your folder called public, mount it as a webshared if it is not already automatic 
you have a route that starts with /images that routes to /images folder and the final urls of these 
images will be localhost:3000/images/1.png
(rename upload folder to images eventually)

---display images assosiated with a post---
in the place where you currently dispay posts, for each posts that you are displaying
besides the actual text that you are display you will need to make another query to get
a list of images for that post, maek a new query that select id from images where postId = to my value
another way to do it is simply join with images table with posts table

use images as a list, do not use images as one item because the relation is one too many

display the image in the board url 