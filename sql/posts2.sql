


SELECT  boards.*, users.name, a.boardId, postCount FROM
	(SELECT boardId, COUNT(*) AS postCount FROM posts GROUP BY boardId) as a
    right join boards on boards.id = a.boardId
    INNER JOIN users ON boards.createdBy=users.id


    
    