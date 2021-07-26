\echo 'Delete and recreate trackrrr db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE trackrrr;
CREATE DATABASE trackrrr;
\connect trackrrr

\i trackrrr-schema.sql

\echo 'Delete and recreate trackrrr_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE trackrrr_test;
CREATE DATABASE trackrrr_test;
\connect trackrrr_test

\i trackrrr-schema.sql