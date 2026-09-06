# Un monolithe modulaire avec un transport métier

L'application démarre comme un monolithe TanStack Start sur Node, avec oRPC pour les opérations métier et PostgreSQL partagé entre modules. Better Auth possède son cycle de session et ses endpoints natifs. Les modules métier cachent autorisation, transactions et invariants derrière quelques opérations cohérentes.

Une séparation en microservices créerait de la coordination réseau avant d'avoir mesuré un besoin. Les tâches longues pourront être extraites dans un worker partageant le même code, sans redéfinir prématurément les interfaces de tous les modules.
