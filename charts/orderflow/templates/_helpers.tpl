{{- define "orderflow.name" -}}orderflow{{- end }}
{{- define "orderflow.labels" -}}
app.kubernetes.io/name: {{ include "orderflow.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version }}
{{- end }}
{{- define "orderflow.selectorLabels" -}}
app.kubernetes.io/name: {{ include "orderflow.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
{{- define "orderflow.image" -}}
{{- $root := index . 0 -}}{{- $image := index . 1 -}}
{{- $registry := ternary (printf "%s/" $root.Values.global.imageRegistry) "" (ne $root.Values.global.imageRegistry "") -}}
{{- if $image.digest -}}{{ printf "%s%s@%s" $registry $image.repository $image.digest }}{{- else -}}{{ required "global.imageTag is required when an image digest is not supplied" $root.Values.global.imageTag | printf "%s%s:%s" $registry $image.repository }}{{- end -}}
{{- end }}
