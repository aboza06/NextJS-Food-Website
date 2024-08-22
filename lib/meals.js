import sql from 'better-sqlite3';
import slugify from 'slugify';
import xss from 'xss';
import fs from 'node:fs'; // allows you to work with file system

const db = sql('meals.db'); // establish data base connection with name of database

export async function getMeals() { //perform action on db
    await new Promise((resolve) => setTimeout(resolve, 2000)); // would not normally add, but used for demo to add delay 
    return db.prepare('SELECT * FROM meals').all(); // SQL statement, all is used to fetch data
} 

export function getMeal(slug) {
    return db.prepare('SELECT * FROM meals WHERE slug = ?').get(slug); // ? is the placeholder where slug is placed
}

export async function saveMeal(meal) {
    meal.slug = slugify(meal.title, { lower: true });
    meal.instructions = xss(meal.instructions); // removes content that would be harmful 

    // Save image to file
    const extension = meal.image.name.split('.').pop();
    const fileName = `${meal.slug}.${extension}`;
    const stream = fs.createWriteStream(`public/images/${fileName}`);
    const bufferedImage = await meal.image.arrayBuffer();
    stream.write(Buffer.from(bufferedImage), (error) => {
        if (error) {
            throw new Error('Saving image failed!'); // Corrected typo: Errror -> Error
        }

        // Store image on db
        meal.image = `/images/${fileName}`;

        // Save to db
        db.prepare(`
            INSERT INTO meals
            (title, summary, instructions, creator, creator_email, image, slug)
            VALUES (
            @title, 
            @summary, 
            @instructions, 
            @creator, 
            @creator_email, 
            @image, 
            @slug
            )
        `).run(meal);
    });
}