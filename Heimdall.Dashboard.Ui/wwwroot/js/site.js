﻿function toHuman(dur) {
    let result = "";
    if (dur.values.years && Math.abs(dur.values.years) > 0)
    {
        result += Math.abs(dur.values.years) + "y"
        if (Math.abs(dur.values.years) < 10 && Math.abs(dur.values.days) > 0)
        {
            result += Math.abs(dur.values.days) + "d"
        }
        return result;
    }
    
    if (dur.values.days && Math.abs(dur.values.days) > 0)
    {
        result += Math.abs(dur.values.days) + "d"
        if (Math.abs(dur.values.days) < 10 && Math.abs(dur.values.hours) > 0)
        {
            result += Math.abs(dur.values.hours) + "h"
        }
        return result;
    }
    
    if (dur.values.hours && Math.abs(dur.values.hours) > 0)
    {
        result += Math.abs(dur.values.hours) + "h"
        if (Math.abs(dur.values.hours) < 10 && Math.abs(dur.values.minutes) > 0)
        {
            result += Math.abs(dur.values.minutes) + "m"
        }
        return result;
    }
    
    if (dur.values.minutes && Math.abs(dur.values.minutes) > 0)
    {
        result += Math.abs(dur.values.minutes) + "m"
        if (Math.abs(dur.values.minutes) < 10 && Math.abs(dur.values.seconds) > 0)
        {
            result += Math.abs(dur.values.seconds) + "s"
        }
        return result;
    }
    
    return result += Math.abs(dur.values.seconds) + "s"
}

function toHumanValues(dur) {
    let result = [];
    if (dur.values.years && Math.abs(dur.values.years) > 0)
    {
        result.push(Math.abs(dur.values.years) + "y");
    }

    if (dur.values.days && Math.abs(dur.values.days) > 0)
    {
        result.push(Math.abs(dur.values.days) + "d");
    }

    if (dur.values.hours && Math.abs(dur.values.hours) > 0)
    {
        result.push(Math.abs(dur.values.hours) + "h");
    }

    if (dur.values.minutes && Math.abs(dur.values.minutes) > 0)
    {
        result.push(Math.abs(dur.values.minutes) + "m");
    }

    return result
}

function getMetric(type, name, options = {}, step = '60s'){
    var DT = luxon.DateTime;
    let end = DT.now();
    let begin = end.minus({ hours: 1 });
    
    let result = `/query_range?start=${begin.toUTC().toISO()}&end=${end.toUTC().toISO()}&step=${step}&query=`;
    result += encodeURIComponent(getMetricQuery(type, name, options))
    return result;
}

function getMetricQuery(type = '', name = '', options = {}) {
    switch(type) {
        case "cluster":
            switch (name) {
                case "node-memory-stats":
                    return `sum(node_memory_MemTotal_bytes{kubernetes_node=~"${options.nodes}"} - (node_memory_MemFree_bytes{kubernetes_node=~"${options.nodes}"} + node_memory_Buffers_bytes{kubernetes_node=~"${options.nodes}"} + node_memory_Cached_bytes{kubernetes_node=~"${options.nodes}"})) by (component)`;
                case "container-memory":
                    return `sum(container_memory_working_set_bytes{container!="POD",container!="",instance=~"${options.nodes}"}) by (component)`;
                case "kube-memory-stats":
                    return `sum({__name__=~"kube_pod_container_resource_requests|kube_pod_container_resource_limits|kube_node_status_capacity|kube_node_status_allocatable", kubernetes_node=~"${options.nodes}", resource="memory"}) by (__name__, component)`;

                case "node-cpu-stats":
                    return `sum(rate(node_cpu_seconds_total{kubernetes_node=~"${options.nodes}", mode=~"user|system"}[1m]))`;
                case "kube-cpu-stats":
                    return `sum({__name__=~"kube_pod_container_resource_requests|kube_pod_container_resource_limits|kube_node_status_capacity|kube_node_status_allocatable", kubernetes_node=~"${options.nodes}", resource="cpu"}) by (__name__, component)`;
            }
            break;
        case "pod":
            switch (name) {
                case "cpu-usage":
                    return `sum(rate(container_cpu_usage_seconds_total{container!="POD",container!="",pod=~"${options.pods}",namespace="${options.namespace}"}[3m])) by (pod)`;
                case "cpu-limits":
                    return `sum(kube_pod_container_resource_limits{pod=~"${options.pods}",resource="cpu",namespace="${options.namespace}"}) by (pod)`;
                case "memory-usage":
                    return `sum(container_memory_working_set_bytes{container!="POD",container!="",pod=~"${options.pods}",namespace="${options.namespace}"}) by (pod)`;
                case "memory-limits":
                    return `sum(kube_pod_container_resource_limits{pod=~"${options.pods}",resource="memory",namespace="${options.namespace}"}) by (pod)`;
                case "fs-usage":
                    return `sum(container_fs_usage_bytes{container!="POD",container!="",pod=~"${options.pods}",namespace="${options.namespace}"}) by (pod)`;
                case "fs-writes":
                    return `sum(rate(container_fs_writes_bytes_total{container!="", pod=~"${options.pods}", namespace="${options.namespace}"}[3m])) by (pod)`;
                case "fs-reads":
                    return `sum(rate(container_fs_reads_bytes_total{container!="", pod=~"${options.pods}", namespace="${options.namespace}"}[3m])) by (pod)`;
                case "network-received":
                    return `sum(rate(container_network_receive_bytes_total{pod=~"${options.pods}",namespace="${options.namespace}"}[3m])) by (pod)`;
                case "network-sent":
                    return `sum(rate(container_network_transmit_bytes_total{pod=~"${options.pods}",namespace="${options.namespace}"}[3m])) by (pod)`;
            }
            break;
    }
    
    return ''
}

function getMetricLastPoints(data, metric= '') {
    let metrics = data
    if (metric.length > 0){
        metrics = metrics.filter(x => x.metric["__name__"] === metric)
    }
    let result = metrics.map(x => {
        try {
            return x.values.slice(-1)[0][1];
        } catch {
            return undefined;
        }
    });

    return parseFloat(result[0]);
}

function getMetricSeries(data, metric= '') {
    let metrics = data
    if (metric.length > 0){
        metrics = metrics.filter(x => x.metric["__name__"] === metric)
    }
    let result = metrics.map(x => {
        try {
            return x.values;
        } catch {
            return undefined;
        }
    });

    return result[0];
}
