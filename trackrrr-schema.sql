CREATE TABLE summoners (
    name VARCHAR(16),
    region VARCHAR(16),
    profile JSONB NOT NULL,
    rank JSONB,
    matches JSONB,
    PRIMARY KEY (name, region)
);