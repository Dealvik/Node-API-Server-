SELECT * FROM employeesystem.boards;

SELECT boards.*, users.name FROM boards INNER JOIN users ON boards.createdBy=users.id
WHERE createdBy=10;

SELECT boardId, COUNT(*) AS postCount FROM posts GROUP BY boardId ORDER BY postCount DESC; 