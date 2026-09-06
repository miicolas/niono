# Les entrées de base sont des pages

Une entrée conserve l'identité, le contenu, les permissions et l'historique d'une page, avec une appartenance à une source de données et des valeurs de propriétés. Les vues référencent cette source et ne dupliquent pas les entrées.

Les valeurs interrogeables sont stockées selon leur type et les relations sont explicites. Ce choix demande davantage de tables qu'un seul objet JSON de propriétés, mais permet des filtres typés et des contraintes cohérentes à mesure que les bases grossissent.
