const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const connString = process.env.DATABASE_URL || 'postgresql://library_db_rrge_user:ReqD8jZk9NS4ZCieQ07BcyPgPvqBEvQr@dpg-dc1srhss728c73dbt2ag-a.oregon-postgres.render.com/library_db_rrge';

const pool = new Pool({
    connectionString: connString,
    ssl: { rejectUnauthorized: false }
});

const rawDataset = [
    // --- Computer Science & Technology ---
    ["Structure and Interpretation of Computer Programs", "Harold Abelson & Gerald Jay Sussman", "978-0262510875", "Technology"],
    ["Computer Networks", "Andrew S. Tanenbaum", "978-0132126953", "Technology"],
    ["Operating System Concepts", "Abraham Silberschatz", "978-1118063330", "Technology"],
    ["Artificial Intelligence: A Modern Approach", "Stuart Russell & Peter Norvig", "978-0136042594", "Technology"],
    ["Compilers: Principles, Techniques, and Tools", "Alfred V. Aho & Monica S. Lam", "978-0321486813", "Technology"],
    ["The Mythical Man-Month", "Frederick P. Brooks Jr.", "978-0201835953", "Technology"],
    ["Cracking the Coding Interview", "Gayle Laakmann McDowell", "978-0984782857", "Technology"],
    ["Designing Data-Intensive Applications", "Martin Kleppmann", "978-1449373320", "Technology"],
    ["Refactoring: Improving the Design of Existing Code", "Martin Fowler", "978-0201485677", "Technology"],
    ["Code: The Hidden Language of Computer Hardware", "Charles Petzold", "978-0735611313", "Technology"],
    ["Introduction to the Theory of Computation", "Michael Sipser", "978-1133187790", "Technology"],
    ["Clean Architecture", "Robert C. Martin", "978-0134494166", "Technology"],
    ["Computer Systems: A Programmer's Perspective", "Randal E. Bryant & David R. O'Hallaron", "978-0134092669", "Technology"],
    ["Modern Operating Systems", "Andrew S. Tanenbaum & Herbert Bos", "978-0133591620", "Technology"],
    ["Database System Concepts", "Abraham Silberschatz & Henry F. Korth", "978-0078022159", "Technology"],
    ["Distributed Systems: Principles and Paradigms", "Andrew S. Tanenbaum & Maarten van Steen", "978-1530281756", "Technology"],
    ["Python Crash Course", "Eric Matthes", "978-1593279288", "Technology"],
    ["Automate the Boring Stuff with Python", "Al Sweigart", "978-1593279929", "Technology"],
    ["Fluent Python", "Luciano Ramalho", "978-1491946008", "Technology"],
    ["Learning JavaScript Design Patterns", "Addy Osmani", "978-1449331818", "Technology"],
    ["You Don't Know JS: Scope & Closures", "Kyle Simpson", "978-1449335588", "Technology"],
    ["Site Reliability Engineering", "Betsy Beyer, Chris Jones & Niall Murphy", "978-1491929124", "Technology"],
    ["Building Microservices", "Sam Newman", "978-1491950357", "Technology"],
    ["Kubernetes Up & Running", "Brendan Burns, Joe Beda & Kelsey Hightower", "978-1492046530", "Technology"],
    ["The Pragmatic Programmer", "David Thomas & Andrew Hunt", "978-0135957059", "Technology"],
    ["Clean Code", "Robert C. Martin", "978-0132350884", "Technology"],
    ["Design Patterns", "Erich Gamma, Richard Helm, Ralph Johnson & John Vlissides", "978-0201633610", "Technology"],
    ["Domain-Driven Design", "Eric Evans", "978-0321125217", "Technology"],
    ["Programming Rust", "Jim Blandy, Jason Orendorff & Leonora Tindall", "978-1492052593", "Technology"],
    ["The Go Programming Language", "Alan A. A. Donovan & Brian W. Kernighan", "978-0134190440", "Technology"],
    ["Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow", "Aurélien Géron", "978-1492032649", "Technology"],
    ["Deep Learning", "Ian Goodfellow, Yoshua Bengio & Aaron Courville", "978-0262035613", "Technology"],
    ["Pattern Recognition and Machine Learning", "Christopher M. Bishop", "978-0387310732", "Technology"],
    ["Grokking Algorithms", "Aditya Y. Bhargava", "978-1617292231", "Technology"],
    ["Algorithms", "Robert Sedgewick & Kevin Wayne", "978-0321573513", "Technology"],
    ["Introduction to Algorithms", "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest & Clifford Stein", "978-0262033848", "Technology"],
    ["The Linux Programming Interface", "Michael Kerrisk", "978-1593272203", "Technology"],
    ["Practical Malware Analysis", "Michael Sikorski & Andrew Honig", "978-1593272906", "Technology"],
    ["Web Application Hacker's Handbook", "Dafydd Stuttard & Marcus Pinto", "978-1118026472", "Technology"],
    ["The Phoenix Project", "Gene Kim, Kevin Behr & George Spafford", "978-0988262591", "Technology"],

    // --- Academics & Mathematics ---
    ["Calculus: Early Transcendentals", "James Stewart", "978-1285741550", "Academics"],
    ["Linear Algebra and Its Applications", "Gilbert Strang", "978-0030105678", "Academics"],
    ["Principles of Mathematical Analysis", "Walter Rudin", "978-0070542358", "Academics"],
    ["Probability and Statistics for Engineers", "Ronald E. Walpole", "978-0321629111", "Academics"],
    ["Introduction to Electrodynamics", "David J. Griffiths", "978-1108420419", "Academics"],
    ["Classical Mechanics", "John R. Taylor", "978-1891389221", "Academics"],
    ["Introduction to Quantum Mechanics", "David J. Griffiths", "978-1107189638", "Academics"],
    ["Thermal Physics", "Charles Kittel & Herbert Kroemer", "978-0716710882", "Academics"],
    ["Discrete Mathematics and Its Applications", "Kenneth H. Rosen", "978-0073383095", "Academics"],
    ["Abstract Algebra", "David S. Dummit & Richard M. Foote", "978-0471433347", "Academics"],
    ["Differential Equations and Linear Algebra", "Gilbert Strang", "978-0980232790", "Academics"],
    ["Complex Analysis", "Lars Ahlfors", "978-0070006577", "Academics"],
    ["Topology", "James Munkres", "978-0131816299", "Academics"],
    ["Linear Algebra Done Right", "Sheldon Axler", "978-3319110790", "Academics"],
    ["Calculus", "Michael Spivak", "978-0914098911", "Academics"],
    ["Real and Complex Analysis", "Walter Rudin", "978-0070542341", "Academics"],
    ["Statistical Inference", "George Casella & Roger L. Berger", "978-0534243128", "Academics"],
    ["All of Statistics: A Concise Course in Statistical Inference", "Larry Wasserman", "978-0387402727", "Academics"],
    ["Numerical Analysis", "Richard L. Burden & J. Douglas Faires", "978-1305253667", "Academics"],
    ["Vector Calculus", "Jerrold E. Marsden & Anthony Tromba", "978-1429215084", "Academics"],
    ["Introduction to Probability Models", "Sheldon M. Ross", "978-0128143469", "Academics"],
    ["Organic Chemistry", "Paula Yurkanis Bruice", "978-0134042282", "Academics"],
    ["Biochemistry", "Jeremy M. Berg, John L. Tymoczko & Lubert Stryer", "978-1464126109", "Academics"],
    ["Molecular Biology of the Cell", "Bruce Alberts", "978-0815344322", "Academics"],
    ["Microeconomic Theory", "Andreu Mas-Colell, Michael D. Whinston & Jerry R. Green", "978-0195073409", "Academics"],

    // --- Science & Nature ---
    ["The Feynman Lectures on Physics", "Richard P. Feynman", "978-0465023820", "Science"],
    ["A Brief History of Time", "Stephen Hawking", "978-0553380163", "Science"],
    ["Cosmos", "Carl Sagan", "978-0345331359", "Science"],
    ["The Selfish Gene", "Richard Dawkins", "978-0199291151", "Science"],
    ["Astrophysics for People in a Hurry", "Neil deGrasse Tyson", "978-0393609394", "Science"],
    ["The Elegant Universe", "Brian Greene", "978-0393058581", "Science"],
    ["The Gene: An Intimate History", "Siddhartha Mukherjee", "978-1476733500", "Science"],
    ["The Emperor of All Maladies", "Siddhartha Mukherjee", "978-1439170915", "Science"],
    ["Silent Spring", "Rachel Carson", "978-0618249060", "Science"],
    ["The Origin of Species", "Charles Darwin", "978-0451529060", "Science"],
    ["What If?: Serious Scientific Answers to Absurd Hypothetical Questions", "Randall Munroe", "978-0544272996", "Science"],
    ["The Demon-Haunted World", "Carl Sagan", "978-0345409461", "Science"],
    ["Seven Brief Lessons on Physics", "Carlo Rovelli", "978-0399184413", "Science"],
    ["Order of Time", "Carlo Rovelli", "978-0735216105", "Science"],
    ["Life 3.0: Being Human in the Age of Artificial Intelligence", "Max Tegmark", "978-1101946596", "Science"],
    ["The Fabric of the Cosmos", "Brian Greene", "978-0375727207", "Science"],
    ["Pale Blue Dot", "Carl Sagan", "978-0345376596", "Science"],
    ["The Double Helix", "James D. Watson", "978-0743216302", "Science"],
    ["Until the End of Time", "Brian Greene", "978-1524731670", "Science"],
    ["Six Easy Pieces", "Richard P. Feynman", "978-0465025275", "Science"],

    // --- World Literature & Classics ---
    ["1984", "George Orwell", "978-0451524935", "Fiction"],
    ["Brave New World", "Aldous Huxley", "978-0060850524", "Fiction"],
    ["Pride and Prejudice", "Jane Austen", "978-0141439518", "Fiction"],
    ["Crime and Punishment", "Fyodor Dostoevsky", "978-0140449136", "Fiction"],
    ["The Catcher in the Rye", "J.D. Salinger", "978-0316769488", "Fiction"],
    ["One Hundred Years of Solitude", "Gabriel Garcia Marquez", "978-0060883287", "Fiction"],
    ["The Lord of the Rings", "J.R.R. Tolkien", "978-0544003415", "Fiction"],
    ["Fahrenheit 451", "Ray Bradbury", "978-1451673319", "Fiction"],
    ["The Alchemist", "Paulo Coelho", "978-0062315007", "Fiction"],
    ["The Great Gatsby", "F. Scott Fitzgerald", "978-0743273565", "Fiction"],
    ["To Kill a Mockingbird", "Harper Lee", "978-0061120084", "Fiction"],
    ["The Brothers Karamazov", "Fyodor Dostoevsky", "978-0374528379", "Fiction"],
    ["War and Peace", "Leo Tolstoy", "978-1400079988", "Fiction"],
    ["Anna Karenina", "Leo Tolstoy", "978-0143035008", "Fiction"],
    ["The Odyssey", "Homer", "978-0140268867", "Fiction"],
    ["The Iliad", "Homer", "978-0140275360", "Fiction"],
    ["The Metamorphosis", "Franz Kafka", "978-0553213690", "Fiction"],
    ["The Trial", "Franz Kafka", "978-0805209990", "Fiction"],
    ["The Stranger", "Albert Camus", "978-0679720201", "Fiction"],
    ["Don Quixote", "Miguel de Cervantes", "978-0060934347", "Fiction"],
    ["The Hobbit", "J.R.R. Tolkien", "978-0547928227", "Fiction"],
    ["Catch-22", "Joseph Heller", "978-1451626650", "Fiction"],
    ["Slaughterhouse-Five", "Kurt Vonnegut", "978-0385333849", "Fiction"],
    ["Animal Farm", "George Orwell", "978-0451526342", "Fiction"],
    ["Lord of the Flies", "William Golding", "978-0399501487", "Fiction"],
    ["Jane Eyre", "Charlotte Brontë", "978-0141441146", "Fiction"],
    ["Wuthering Heights", "Emily Brontë", "978-0141439556", "Fiction"],
    ["Frankenstein", "Mary Shelley", "978-0486282114", "Fiction"],
    ["Dracula", "Bram Stoker", "978-0486411095", "Fiction"],
    ["Moby-Dick", "Herman Melville", "978-1503280786", "Fiction"],
    ["The Picture of Dorian Gray", "Oscar Wilde", "978-0141439570", "Fiction"],
    ["Les Misérables", "Victor Hugo", "978-0451419439", "Fiction"],
    ["The Count of Monte Cristo", "Alexandre Dumas", "978-0140449266", "Fiction"],
    ["Dune", "Frank Herbert", "978-0441172719", "Fiction"],
    ["Neuromancer", "William Gibson", "978-0441569595", "Fiction"],
    ["Foundation", "Isaac Asimov", "978-0553293357", "Fiction"],

    // --- Non-Fiction & Social Sciences ---
    ["Thinking, Fast and Slow", "Daniel Kahneman", "978-0374533557", "Non-Fiction"],
    ["Guns, Germs, and Steel", "Jared Diamond", "978-0393317558", "Non-Fiction"],
    ["Man's Search for Meaning", "Viktor E. Frankl", "978-0807014295", "Non-Fiction"],
    ["Influence: The Psychology of Persuasion", "Robert B. Cialdini", "978-0061241895", "Non-Fiction"],
    ["Educated", "Tara Westover", "978-0399590504", "Non-Fiction"],
    ["Freakonomics", "Steven D. Levitt & Stephen J. Dubner", "978-0060731335", "Non-Fiction"],
    ["Zero to One", "Peter Thiel & Blake Masters", "978-0804139298", "Non-Fiction"],
    ["Good to Great", "Jim Collins", "978-0066620992", "Non-Fiction"],
    ["The Black Swan", "Nassim Nicholas Taleb", "978-1400063512", "Non-Fiction"],
    ["Antifragile: Things That Gain from Disorder", "Nassim Nicholas Taleb", "978-1400067824", "Non-Fiction"],
    ["Fooled by Randomness", "Nassim Nicholas Taleb", "978-0812975215", "Non-Fiction"],
    ["Outliers: The Story of Success", "Malcolm Gladwell", "978-0316017930", "Non-Fiction"],
    ["The Tipping Point", "Malcolm Gladwell", "978-0316346627", "Non-Fiction"],
    ["Blink: The Power of Thinking Without Thinking", "Malcolm Gladwell", "978-0316010665", "Non-Fiction"],
    ["Bad Blood: Secrets and Lies in a Silicon Valley Startup", "John Carreyrou", "978-1524731656", "Non-Fiction"],
    ["Quiet: The Power of Introverts", "Susan Cain", "978-0307352156", "Non-Fiction"],
    ["Smarter Faster Better", "Charles Duhigg", "978-0812993011", "Non-Fiction"],
    ["Factfulness", "Hans Rosling", "978-1250107817", "Non-Fiction"],
    ["Grit: The Power of Passion and Perseverance", "Angela Duckworth", "978-1501111105", "Non-Fiction"],
    ["Mindset: The New Psychology of Success", "Carol S. Dweck", "978-0345472328", "Non-Fiction"],
    ["The Righteous Mind", "Jonathan Haidt", "978-0307455772", "Non-Fiction"],
    ["Drive: The Surprising Truth About What Motivates Us", "Daniel H. Pink", "978-1594484803", "Non-Fiction"],
    ["The Checklist Manifesto", "Atul Gawande", "978-0312430009", "Non-Fiction"],
    ["Being Mortal", "Atul Gawande", "978-1250081247", "Non-Fiction"],
    ["The Innovator's Dilemma", "Clayton M. Christensen", "978-1633691780", "Non-Fiction"],

    // --- Philosophy & Thought ---
    ["Meditations", "Marcus Aurelius", "978-0812968255", "Philosophy"],
    ["The Republic", "Plato", "978-0140455113", "Philosophy"],
    ["Beyond Good and Evil", "Friedrich Nietzsche", "978-0140449235", "Philosophy"],
    ["Letters from a Stoic", "Seneca", "978-0140442106", "Philosophy"],
    ["Critique of Pure Reason", "Immanuel Kant", "978-0521657297", "Philosophy"],
    ["The Wealth of Nations", "Adam Smith", "978-0553585971", "Philosophy"],
    ["The Art of War", "Sun Tzu", "978-1599869773", "Philosophy"],
    ["Nicomachean Ethics", "Aristotle", "978-0199213610", "Philosophy"],
    ["Thus Spoke Zarathustra", "Friedrich Nietzsche", "978-0140441185", "Philosophy"],
    ["The Prince", "Niccolò Machiavelli", "978-0140449150", "Philosophy"],
    ["Being and Time", "Martin Heidegger", "978-0791426784", "Philosophy"],
    ["Tractatus Logico-Philosophicus", "Ludwig Wittgenstein", "978-0486404455", "Philosophy"],
    ["Philosophical Investigations", "Ludwig Wittgenstein", "978-1405159289", "Philosophy"],
    ["The Myth of Sisyphus", "Albert Camus", "978-0679733737", "Philosophy"],
    ["Discourse on Method", "René Descartes", "978-0140446999", "Philosophy"],
    ["Ethics", "Baruch Spinoza", "978-0140435719", "Philosophy"],
    ["Leviathan", "Thomas Hobbes", "978-0140431957", "Philosophy"],
    ["Two Treatises of Government", "John Locke", "978-0521357302", "Philosophy"],
    ["The Social Contract", "Jean-Jacques Rousseau", "978-0140442014", "Philosophy"],
    ["On Liberty", "John Stuart Mill", "978-0141441474", "Philosophy"],
    ["Utilitarianism", "John Stuart Mill", "978-0872206052", "Philosophy"],
    ["The World as Will and Representation", "Arthur Schopenhauer", "978-0486217611", "Philosophy"],
    ["Existentialism is a Humanism", "Jean-Paul Sartre", "978-0300115468", "Philosophy"],
    ["Being and Nothingness", "Jean-Paul Sartre", "978-0671867805", "Philosophy"],

    // --- Self-Help, Leadership & Productivity ---
    ["Atomic Habits", "James Clear", "978-0735211292", "Self-Help"],
    ["The Power of Habit", "Charles Duhigg", "978-0812981605", "Self-Help"],
    ["Deep Work", "Cal Newport", "978-1455586691", "Self-Help"],
    ["Principles: Life and Work", "Ray Dalio", "978-1501124020", "Self-Help"],
    ["The 7 Habits of Highly Effective People", "Stephen R. Covey", "978-1982137274", "Self-Help"],
    ["How to Win Friends and Influence People", "Dale Carnegie", "978-0671027032", "Self-Help"],
    ["Can't Hurt Me: Master Your Mind and Defy the Odds", "David Goggins", "978-1544512280", "Self-Help"],
    ["Make Time: How to Focus on What Matters", "Jake Knapp & John Zeratsky", "978-0525572428", "Self-Help"],
    ["Essentialism: The Disciplined Pursuit of Less", "Greg McKeown", "978-0804137386", "Self-Help"],
    ["Digital Minimalism", "Cal Newport", "978-0525536512", "Self-Help"],
    ["Show Your Work!", "Austin Kleon", "978-0761178972", "Self-Help"],
    ["Steal Like an Artist", "Austin Kleon", "978-0761169253", "Self-Help"],
    ["Getting Things Done", "David Allen", "978-0143126560", "Self-Help"],
    ["The Subtle Art of Not Giving a F*ck", "Mark Manson", "978-0062457714", "Self-Help"],
    ["12 Rules for Life", "Jordan B. Peterson", "978-0345816023", "Self-Help"],
    ["Think and Grow Rich", "Napoleon Hill", "978-1585424337", "Self-Help"],
    ["The 4-Hour Workweek", "Timothy Ferriss", "978-0307465351", "Self-Help"],
    ["Tools of Titans", "Timothy Ferriss", "978-1328683786", "Self-Help"],
    ["Atomic Focus", "Michael Gardner", "978-1951949181", "Self-Help"],
    ["Peak: Secrets from the New Science of Expertise", "Anders Ericsson & Robert Pool", "978-0544947221", "Self-Help"],

    // --- History & Civilizations ---
    ["Sapiens: A Brief History of Humankind", "Yuval Noah Harari", "978-0062316097", "History"],
    ["Homo Deus: A Brief History of Tomorrow", "Yuval Noah Harari", "978-0062464316", "History"],
    ["21 Lessons for the 21st Century", "Yuval Noah Harari", "978-0525512172", "History"],
    ["The Silk Roads: A New History of the World", "Peter Frankopan", "978-1101912379", "History"],
    ["A People's History of the United States", "Howard Zinn", "978-0062397348", "History"],
    ["The History of the Ancient World", "Susan Wise Bauer", "978-0393059748", "History"],
    ["Postwar: A History of Europe Since 1945", "Tony Judt", "978-0143037750", "History"],
    ["The Rise and Fall of the Third Reich", "William L. Shirer", "978-1451651683", "History"],
    ["SPQR: A History of Ancient Rome", "Mary Beard", "978-0871404237", "History"],
    ["The Lessons of History", "Will Durant & Ariel Durant", "978-1439149959", "History"],
    ["The Crusades: The Authoritative History of the War for the Holy Land", "Thomas Asbridge", "978-0060787295", "History"],
    ["Ghettoside: A True Story of Murder in America", "Jill Leovy", "978-0812986877", "History"],
    ["The Plantagenets", "Dan Jones", "978-0143124252", "History"],
    ["The Wars of the Roses", "Dan Jones", "978-0143127888", "History"],
    ["Genghis Khan and the Making of the Modern World", "Jack Weatherford", "978-0609809648", "History"],
    ["Rubicon: The Last Years of the Roman Republic", "Tom Holland", "978-1400078974", "History"],
    ["Persian Fire: The First World Empire and the Battle for the West", "Tom Holland", "978-0307279484", "History"],
    ["The Storm of War: A New History of the Second World War", "Andrew Roberts", "978-0061228605", "History"],
    ["Churchill: Walking with Destiny", "Andrew Roberts", "978-1101980996", "History"],
    ["Napoleon: A Life", "Andrew Roberts", "978-0143127857", "History"],

    // --- Other & Interdisciplinary ---
    ["The Design of Everyday Things", "Don Norman", "978-0465050659", "Other"],
    ["Sprint: How to Solve Big Problems in Five Days", "Jake Knapp", "978-1501121746", "Other"],
    ["Hooked: How to Build Habit-Forming Products", "Nir Eyal", "978-1591847786", "Other"],
    ["Don't Make Me Think, Revisited", "Steve Krug", "978-0321965516", "Other"],
    ["Universal Principles of Design", "William Lidwell, Kritina Holden & Jill Butler", "978-1592535873", "Other"],
    ["The Elements of Style", "William Strunk Jr. & E.B. White", "978-0205309023", "Other"],
    ["On Writing: A Memoir of the Craft", "Stephen King", "978-1439156810", "Other"],
    ["Bird by Bird: Some Instructions on Writing and Life", "Anne Lamott", "978-0385480017", "Other"],
    ["The Art of Looking Sideways", "Alan Fletcher", "978-0714834498", "Other"],
    ["Ways of Seeing", "John Berger", "978-0140135152", "Other"]
];

const studentNames = [
    "Alice Johnson", "Bob Smith", "Charlie Davis", "Emily Watson", "David Miller",
    "Rohan Gupta", "Samantha Lee", "Alex Chen", "Liam Taylor", "Kavita Sharma",
    "Michael Brown", "Priya Patel", "James Wilson", "Daniel Martinez", "Sophia Davis",
    "Ethan Clark", "Oliver White", "Aria Stark", "Lucas Wright", "Chloe Bennett",
    "Noah Adams", "Mia Robinson", "Benjamin Scott", "Zoe Hall", "Alexander King",
    "Ella Green", "Henry Baker", "Grace Nelson", "Jackson Carter", "Lily Mitchell",
    "Samuel Perez", "Hannah Roberts", "Gabriel Turner", "Victoria Phillips", "Sebastian Campbell"
];

async function seed200() {
    console.log(`Preparing ${rawDataset.length} unique real books...`);

    let csvContent = 'Title,Author,ISBN,Category,Status,Borrower,BorrowerID,IssueDate,DueDate\n';

    let issuedCount = 0;
    let overdueCount = 0;

    for (let i = 0; i < rawDataset.length; i++) {
        const [title, author, isbn, category] = rawDataset[i];

        let status = 'Available';
        let borrower = null;
        let borrower_id = null;
        let issue_date = null;
        let due_date = null;

        // Roughly 30% issued, 10% overdue
        if (i % 3 === 0) {
            status = 'Issued';
            const student = studentNames[i % studentNames.length];
            borrower = student;
            borrower_id = `STU-2024-${String(100 + i).padStart(3, '0')}`;

            if (i % 7 === 0) {
                // Overdue
                overdueCount++;
                const pastDays = (i % 12) + 2;
                const d = new Date();
                d.setDate(d.getDate() - pastDays);
                due_date = d.toISOString().split('T')[0];

                const issueD = new Date(d);
                issueD.setDate(issueD.getDate() - 14);
                issue_date = issueD.toISOString().split('T')[0];
            } else {
                // Active loan
                issuedCount++;
                const issueD = new Date();
                issueD.setDate(issueD.getDate() - (i % 10));
                issue_date = issueD.toISOString().split('T')[0];

                const dueD = new Date(issueD);
                dueD.setDate(dueD.getDate() + 14);
                due_date = dueD.toISOString().split('T')[0];
            }
        }

        await pool.query(`
            INSERT INTO books (title, author, isbn, category, status, borrower, borrower_id, issue_date, due_date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (isbn) DO UPDATE SET
                title = EXCLUDED.title,
                author = EXCLUDED.author,
                category = EXCLUDED.category,
                status = EXCLUDED.status,
                borrower = EXCLUDED.borrower,
                borrower_id = EXCLUDED.borrower_id,
                issue_date = EXCLUDED.issue_date,
                due_date = EXCLUDED.due_date;
        `, [
            title, author, isbn, category, status,
            borrower, borrower_id, issue_date, due_date
        ]);

        const clean = str => `"${(str || '').toString().replace(/"/g, '""')}"`;
        csvContent += `${clean(title)},${clean(author)},${clean(isbn)},${clean(category)},${clean(status)},${clean(borrower)},${clean(borrower_id)},${clean(issue_date)},${clean(due_date)}\n`;
    }

    const csvPath = path.join(__dirname, '..', 'database', 'real_library_dataset.csv');
    fs.writeFileSync(csvPath, csvContent, 'utf8');

    const finalCount = await pool.query('SELECT COUNT(*) FROM books');
    console.log(`Success! Total books now in PostgreSQL: ${finalCount.rows[0].count}`);
    console.log(`Issued: ${issuedCount}, Overdue: ${overdueCount}`);

    await pool.end();
}

seed200().catch(err => {
    console.error('Error seeding 200 books:', err);
    pool.end();
});
