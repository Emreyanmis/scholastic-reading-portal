package com.scholastic.portal.seed;

import com.scholastic.portal.domain.Assignment;
import com.scholastic.portal.domain.AssignmentStatus;
import com.scholastic.portal.domain.Book;
import com.scholastic.portal.domain.Role;
import com.scholastic.portal.domain.User;
import com.scholastic.portal.repo.AssignmentRepository;
import com.scholastic.portal.repo.BookRepository;
import com.scholastic.portal.repo.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * On boot, if the database is empty we insert a demo teacher, three students,
 * six books, and two starter assignments. Idempotent — does nothing on
 * subsequent boots.
 */
@Component
public class SeedRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SeedRunner.class);

    private final UserRepository users;
    private final BookRepository books;
    private final AssignmentRepository assignments;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public SeedRunner(UserRepository users, BookRepository books, AssignmentRepository assignments) {
        this.users = users;
        this.books = books;
        this.assignments = assignments;
    }

    @Override
    public void run(String... args) {
        if (users.count() > 0) {
            log.info("Seed: database already populated, skipping.");
            return;
        }
        log.info("Seed: empty database — inserting demo data.");

        User teacher = users.save(new User("teacher@demo.com", "Ms. Rivera",
            encoder.encode("teacher123"), Role.TEACHER));

        User alex   = users.save(new User("alex@demo.com",   "Alex Chen",     encoder.encode("student123"), Role.STUDENT));
        User jordan = users.save(new User("jordan@demo.com", "Jordan Patel",  encoder.encode("student123"), Role.STUDENT));
        users.save(new User("sam@demo.com",    "Sam Williams",  encoder.encode("student123"), Role.STUDENT));

        List<Book> seeded = List.of(
            new Book("The Lighthouse on Maple Street", "A. Quinn", "#fde68a", "Grades 3-5",
                "When the lighthouse on Maple Street goes dark, three friends set out to discover the secret keeping it from shining.",
                """
                Chapter 1 — The Dark Night

                The lighthouse had been dark for seven nights. Mia counted each one from her bedroom window. On the eighth, she packed a flashlight, two granola bars, and her grandfather's old compass, and she went to find out why.

                Chapter 2 — The Hidden Stairs

                Behind the keeper's cottage, half-buried in ivy, was a door Mia had never noticed. It opened to a staircase that smelled like old paper and salt. She took a breath, switched on her flashlight, and started down.

                Chapter 3 — What the Light Remembers

                At the bottom of the stairs, the lamp from the lighthouse sat on a workbench, its glass cracked. Beside it was a letter, addressed to whoever found it. Mia read it twice, then again. Then she knew exactly what to do.
                """),
            new Book("Migrations", "R. Okafor", "#bae6fd", "Grades 6-8",
                "A young naturalist tracks a flock of geese across three countries and learns that home is a direction, not a place.",
                """
                Prologue

                Every autumn, my grandmother said, the geese remember the way home before the people do. I did not understand her then.

                Part One — North

                We left in September. The maps were folded into the glove box and the binoculars hung from my neck like a strange necklace...

                Part Two — The River Bend

                By October the river had turned silver. The flock landed for three nights and we slept in the truck with the windows cracked open so we could hear them breathing in their sleep.
                """),
            new Book("How Computers Dream", "T. Alvarez", "#ddd6fe", "Grades 6-8",
                "A friendly tour through the surprising history of how machines learned to imagine — from punch cards to neural nets.",
                """
                Introduction

                Before computers could dream, they could barely count. This is the story of how we taught them.

                Chapter 1 — Cards With Holes

                In 1801, a French weaver named Joseph Marie Jacquard built a loom that could read instructions punched into cards. He did not know it, but he had just invented the great-great-grandparent of every program ever written.

                Chapter 2 — The Imitation Game

                A hundred and fifty years later, a mathematician named Alan Turing asked a simple, dangerous question: can machines think? He did not answer it. He gave us a way to keep asking.
                """),
            new Book("The Garden That Wasn't There", "S. Park", "#bbf7d0", "Grades 2-4",
                "Ollie plants seeds in an empty lot. Something unexpected grows, and the whole neighborhood notices.",
                """
                Chapter 1

                The lot at the end of Ollie's street was full of broken glass and weeds. Ollie did not mind. He had a packet of sunflower seeds and a plastic shovel, and he had time.

                Chapter 2

                The first sprouts pushed up after a week of rain. By the end of the month, three neighbors had brought tomato plants. By the end of the summer, the lot had a name.
                """),
            new Book("Atlas of Tiny Kingdoms", "P. Liang", "#fbcfe8", "Grades 4-6",
                "An illustrated tour of micro-nations, hidden valleys, and the strange small places that don't make it onto big maps.",
                """
                Foreword

                The biggest maps lie the most. They flatten mountains, hide rivers, and forget about the tiny kingdoms entirely.

                Entry 1 — The Republic of the Roof Garden

                Population: 42 (including the cat). Chief export: tomatoes. Anthem: hummed.

                Entry 2 — The Valley Behind the Library

                Found only after closing time. No one has ever mapped its eastern edge.
                """),
            new Book("Signals", "J. Hart", "#fecaca", "Grades 7-9",
                "A short novel about a radio club in 1989, the static between two cities, and the messages that got through anyway.",
                """
                Chapter 1 — Channel Open

                The radio in Sam's basement was older than Sam was. It hissed like a cat when it warmed up, and on a clear night it could pull in voices from three states away.

                Chapter 2 — A Voice From Sofia

                The first time he heard her, he thought it was a recording. The second time, she said his call sign back.
                """)
        );
        seeded.forEach(books::save);

        Book lighthouse = seeded.get(0);
        Book migrations = seeded.get(1);

        Assignment a1 = new Assignment(lighthouse, teacher, alex,
            Instant.now().plus(7, ChronoUnit.DAYS));
        a1.seedStatus(AssignmentStatus.IN_PROGRESS);
        a1.seedMinutes(18);
        assignments.save(a1);

        assignments.save(new Assignment(migrations, teacher, jordan,
            Instant.now().plus(14, ChronoUnit.DAYS)));

        log.info("Seed: inserted {} users, {} books, {} assignments.",
            users.count(), books.count(), assignments.count());
    }
}
